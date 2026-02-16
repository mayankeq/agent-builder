# Deployment Guide

Complete guide for deploying Agent-Builder to production environments.

## Table of Contents
- [Terraform Deployment (Recommended)](#terraform-deployment-recommended)
- [Local Development](#local-development)
- [Production Deployment (AWS)](#production-deployment-aws)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Migration](#database-migration)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Backup and Recovery](#backup-and-recovery)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Terraform Deployment (Recommended)

The recommended approach for deploying Agent-Builder is using Terraform. All infrastructure code is located in the `terraform/` directory.

### Quick Start with Terraform

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Initialize Terraform
terraform init

# 3. Plan deployment (staging)
terraform plan -var-file="environments/staging.tfvars" -out=tfplan

# 4. Apply infrastructure
terraform apply tfplan

# 5. Get outputs
terraform output -json
```

### Using the Deploy Script

A helper script is provided for common operations:

```bash
# Make executable
chmod +x scripts/deploy.sh

# Full deployment to staging
./scripts/deploy.sh staging full-deploy

# Full deployment to production
./scripts/deploy.sh production full-deploy

# Just plan changes
./scripts/deploy.sh production plan

# Check status
./scripts/deploy.sh production status

# View logs
./scripts/deploy.sh production logs
```

### Infrastructure Components

The Terraform configuration creates:

- **VPC** (10.0.0.0/16) with public/private subnets across 2 AZs
- **NAT Gateways** (one per AZ for high availability)
- **RDS PostgreSQL 15** (Multi-AZ, db.t3.medium)
- **S3 Bucket** (versioned, encrypted, with lifecycle policies)
- **ECS Fargate** cluster with backend and frontend services
- **Application Load Balancer** with HTTPS support
- **ECR** repositories for Docker images
- **CloudWatch** alarms and dashboard
- **SSM Parameter Store** for secrets

See `terraform/README.md` for detailed Terraform documentation.

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git
- AWS CLI (for S3 testing)
- Anthropic API key

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/agent-builder.git
cd agent-builder

# 2. Install dependencies
npm install

# 3. Setup database
createdb agent_builder
psql agent_builder < migrations/001_initial_schema.sql

# 4. Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"

# 5. Configure environment
cp .env.example .env
# Edit .env with your values

# 6. Build TypeScript
npm run build

# 7. Start development server
npm run dev:server
```

### Development Workflow

```bash
# Terminal 1: Watch and rebuild TypeScript
npm run dev

# Terminal 2: Run server with nodemon (auto-restart)
npm run dev:server

# Terminal 3: Run tests
npm test

# Check health
curl http://localhost:3000/health
```

---

## Production Deployment (AWS)

### Architecture Overview

```
Internet
   |
   v
Route 53 (DNS)
   |
   v
CloudFront (CDN) -------> S3 (Static Assets)
   |
   v
ALB (Load Balancer)
   |
   v
ECS Fargate (Containers)
   |
   +----> RDS PostgreSQL (Multi-AZ)
   +----> S3 (Artifacts)
   +----> CloudWatch (Logs/Metrics)
   +----> Secrets Manager
```

### Prerequisites

- AWS Account with appropriate permissions
- Domain name (for SSL certificate)
- AWS CLI configured
- Docker installed locally
- Terraform or CloudFormation (optional but recommended)

### Step 1: Setup VPC and Networking

```bash
# Using AWS CLI
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=agent-builder-vpc}]'

# Create public subnets (for ALB)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b

# Create private subnets (for ECS and RDS)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.12.0/24 \
  --availability-zone us-east-1b
```

### Step 2: Setup RDS PostgreSQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name agent-builder-db-subnet \
  --db-subnet-group-description "Agent Builder DB Subnet Group" \
  --subnet-ids subnet-private-1 subnet-private-2

# Create security group
aws ec2 create-security-group \
  --group-name agent-builder-db-sg \
  --description "Security group for Agent Builder RDS" \
  --vpc-id vpc-xxxxxxxx

# Allow PostgreSQL access from ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-db-xxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-xxxxxxxx

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier agent-builder-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --db-subnet-group-name agent-builder-db-subnet \
  --vpc-security-group-ids sg-db-xxxxxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --publicly-accessible false
```

### Step 3: Setup S3 Bucket

```bash
# Create bucket with versioning and encryption
aws s3api create-bucket \
  --bucket agent-builder-artifacts-prod \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket agent-builder-artifacts-prod \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket agent-builder-artifacts-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Set lifecycle policy (delete after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket agent-builder-artifacts-prod \
  --lifecycle-configuration file://s3-lifecycle.json
```

**s3-lifecycle.json**:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldArtifacts",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "sessions/"
      },
      "Expiration": {
        "Days": 90
      },
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
```

### Step 4: Store Secrets in Secrets Manager

```bash
# JWT Secret
aws secretsmanager create-secret \
  --name agent-builder/jwt-secret \
  --secret-string "$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")"

# Encryption Key
aws secretsmanager create-secret \
  --name agent-builder/encryption-key \
  --secret-string "$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"

# Database Password
aws secretsmanager create-secret \
  --name agent-builder/db-password \
  --secret-string "your-secure-db-password"

# Google OAuth
aws secretsmanager create-secret \
  --name agent-builder/google-oauth \
  --secret-string '{
    "clientId": "your-google-client-id",
    "clientSecret": "your-google-client-secret"
  }'
```

### Step 5: Build and Push Docker Image

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY templates ./templates
COPY config ./config

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
```

**Build and push**:
```bash
# Build image
docker build -t agent-builder:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag agent-builder:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-builder:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-builder:latest
```

### Step 6: Deploy ECS Service

**task-definition.json**:
```json
{
  "family": "agent-builder",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/agent-builder-task-role",
  "containerDefinitions": [
    {
      "name": "agent-builder",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-builder:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "DB_HOST", "value": "agent-builder-db.xxxxxx.us-east-1.rds.amazonaws.com"},
        {"name": "DB_NAME", "value": "agent_builder"},
        {"name": "DB_USER", "value": "postgres"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "AWS_S3_BUCKET", "value": "agent-builder-artifacts-prod"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:agent-builder/jwt-secret"
        },
        {
          "name": "ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:agent-builder/encryption-key"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:agent-builder/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agent-builder",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Create ECS Service**:
```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster agent-builder-cluster \
  --service-name agent-builder-service \
  --task-definition agent-builder \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-private-1,subnet-private-2],
    securityGroups=[sg-ecs-xxxxxxxx],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=agent-builder,containerPort=3000" \
  --health-check-grace-period-seconds 60
```

### Step 7: Setup Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name agent-builder-alb \
  --subnets subnet-public-1 subnet-public-2 \
  --security-groups sg-alb-xxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name agent-builder-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxxxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200

# Create HTTPS listener (after obtaining SSL certificate)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>

# Redirect HTTP to HTTPS
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{
    Protocol=HTTPS,Port=443,StatusCode=HTTP_301
  }"
```

---

## Environment Variables Reference

### Required Variables

```bash
# Application
NODE_ENV=production                    # Environment: development, staging, production
PORT=3000                              # Server port

# Database
DB_HOST=rds-endpoint.amazonaws.com     # PostgreSQL hostname
DB_PORT=5432                           # PostgreSQL port
DB_NAME=agent_builder                  # Database name
DB_USER=postgres                       # Database user
DB_PASSWORD=<from-secrets-manager>     # Database password
DB_POOL_MAX=20                         # Connection pool size
DB_IDLE_TIMEOUT=30000                  # Idle connection timeout (ms)
DB_CONNECTION_TIMEOUT=2000             # Connection timeout (ms)

# Security
JWT_SECRET=<from-secrets-manager>      # JWT signing secret (min 32 chars)
JWT_EXPIRES_IN=7d                      # Token expiration
ENCRYPTION_KEY=<from-secrets-manager>  # AES-256 encryption key (base64, 32 bytes)

# SSO Authentication (at least one required)
GOOGLE_CLIENT_ID=xxx                   # Google OAuth client ID
GOOGLE_CLIENT_SECRET=xxx               # Google OAuth client secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

AZURE_CLIENT_ID=xxx                    # Azure AD client ID
AZURE_CLIENT_SECRET=xxx                # Azure AD client secret
AZURE_TENANT_ID=xxx                    # Azure AD tenant ID
AZURE_CALLBACK_URL=https://api.yourdomain.com/api/auth/azure/callback

# AWS
AWS_REGION=us-east-1                   # AWS region
AWS_S3_BUCKET=agent-builder-artifacts  # S3 bucket for artifacts
# AWS credentials via IAM role (ECS) or:
AWS_ACCESS_KEY_ID=xxx                  # (if not using IAM role)
AWS_SECRET_ACCESS_KEY=xxx              # (if not using IAM role)

# Frontend
FRONTEND_URL=https://yourdomain.com    # Frontend application URL
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com  # CORS origins

# Logging
LOG_LEVEL=info                         # Log level: error, warn, info, debug
LOG_DIR=./logs                         # Log directory

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000           # Rate limit window (15 min)
RATE_LIMIT_MAX_REQUESTS=100           # Max requests per window
AGENT_CREATION_LIMIT_PER_HOUR=10      # Agent creation limit per user

# Monitoring
METRICS_ENABLED=true                   # Enable Prometheus metrics
```

### Optional Variables

```bash
# Development
DISABLE_HELMET=false                   # Disable Helmet.js security headers
DISABLE_RATE_LIMITING=false           # Disable rate limiting

# WebSocket
WS_HEARTBEAT_INTERVAL=30000           # WebSocket heartbeat interval (ms)

# Database
DB_SSL=true                           # Enable SSL for database connection
DB_SSL_REJECT_UNAUTHORIZED=true       # Reject unauthorized SSL certs

# Logging
LOG_FORMAT=json                       # Log format: json or simple
LOG_COLORIZE=false                    # Colorize console logs (dev only)

# Anthropic (for testing, users provide their own)
ANTHROPIC_API_KEY=sk-ant-xxx         # Default API key for testing
```

---

## Database Migration

### Running Migrations

**Initial setup**:
```bash
# Connect to production database
psql -h <rds-endpoint> -U postgres -d agent_builder

# Run migration
\i migrations/001_initial_schema.sql

# Verify
\dt
```

**Using migration scripts**:
```bash
# Add to package.json
"scripts": {
  "migrate": "node scripts/migrate.js",
  "migrate:up": "node scripts/migrate.js up",
  "migrate:down": "node scripts/migrate.js down"
}

# Run
npm run migrate:up
```

**scripts/migrate.js**:
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
});

async function migrate(direction = 'up') {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error.message);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('All migrations completed');
}

migrate(process.argv[2]).catch(console.error);
```

### Creating New Migrations

**Naming convention**: `002_add_new_feature.sql`

```sql
-- Migration: Add new table
-- Created: 2026-02-07

BEGIN;

CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_new_table_created_at ON new_table(created_at);

COMMIT;
```

### Rollback Strategy

Create down migrations for reversibility:

**002_add_new_feature_down.sql**:
```sql
BEGIN;

DROP TABLE IF EXISTS new_table CASCADE;

COMMIT;
```

---

## SSL/HTTPS Configuration

### 1. Request SSL Certificate (AWS ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com api.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Get validation records
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --region us-east-1
```

### 2. Add DNS Validation Records

Add CNAME records to Route 53 or your DNS provider.

### 3. Configure ALB with SSL

Already covered in Step 7 of AWS deployment.

### 4. Force HTTPS in Application

```typescript
// src/server/middleware/force-https.ts
export function forceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production' &&
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
}

// Apply middleware
app.use(forceHTTPS);
```

---

## Monitoring Setup

### CloudWatch Logs

```bash
# Create log group
aws logs create-log-group \
  --log-group-name /ecs/agent-builder

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/agent-builder \
  --retention-in-days 30
```

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name agent-builder-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=agent-builder-service

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name agent-builder-high-memory \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name agent-builder-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Prometheus and Grafana (Optional)

**Deploy Prometheus**:
```bash
# Using Docker Compose
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'agent-builder'
    static_configs:
      - targets: ['<alb-dns>:3000']
    metrics_path: '/metrics'
```

---

## Backup and Recovery

### Database Backups

**Automated RDS Snapshots**:
```bash
# Already configured in RDS creation (7-day retention)
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier agent-builder-db \
  --db-snapshot-identifier agent-builder-manual-$(date +%Y%m%d)
```

**Point-in-Time Recovery**:
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier agent-builder-db \
  --target-db-instance-identifier agent-builder-db-restored \
  --restore-time 2026-02-06T10:30:00Z
```

### S3 Backups

Versioning is already enabled. To restore:
```bash
# List versions
aws s3api list-object-versions \
  --bucket agent-builder-artifacts-prod \
  --prefix sessions/

# Restore specific version
aws s3api get-object \
  --bucket agent-builder-artifacts-prod \
  --key sessions/xxx/artifacts.zip \
  --version-id <version-id> \
  restored-artifacts.zip
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 5 minutes (continuous replication)

**Recovery Steps**:
1. Create new RDS instance from latest snapshot (30 min)
2. Update ECS task definition with new DB endpoint (5 min)
3. Deploy new ECS service revision (10 min)
4. Update Route 53 DNS records (5 min, up to 1 hour for propagation)
5. Verify application functionality (30 min)

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: agent-builder
  ECS_SERVICE: agent-builder-service
  ECS_CLUSTER: agent-builder-cluster
  ECS_TASK_DEFINITION: task-definition.json

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: agent-builder
          image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Verify deployment
        run: |
          ENDPOINT=$(aws elbv2 describe-load-balancers \
            --names agent-builder-alb \
            --query 'LoadBalancers[0].DNSName' \
            --output text)
          curl -f https://$ENDPOINT/health || exit 1
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets stored in Secrets Manager
- [ ] SSL certificate valid
- [ ] Health checks working
- [ ] CloudWatch alarms configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Security audit passed

---

For more details, see:
- [Quick Start Guide](./QUICK_START.md)
- [Architecture Guide](./ARCHITECTURE_ENHANCED.md)
- [Performance Guide](./PERFORMANCE.md)
- [Security Guide](./SECURITY.md)
