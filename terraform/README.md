# Agent Builder - Terraform Infrastructure

This directory contains the complete Terraform configuration for deploying Agent Builder to AWS.

## Directory Structure

```
terraform/
├── main.tf                     # Main configuration and module orchestration
├── variables.tf                # Input variables
├── outputs.tf                  # Output values
├── backend.tf                  # Remote state configuration
├── environments/
│   ├── production.tfvars       # Production environment values
│   └── staging.tfvars          # Staging environment values
└── modules/
    ├── vpc/                    # VPC, subnets, NAT gateways
    ├── security-groups/        # Security groups for ALB, ECS, RDS
    ├── rds/                    # PostgreSQL database
    ├── s3/                     # S3 bucket for artifacts
    ├── ecs/                    # ECS cluster, services, ECR
    ├── alb/                    # Application Load Balancer
    ├── ssm/                    # Parameter Store secrets
    └── cloudwatch/             # Alarms and dashboard
```

## Prerequisites

1. **Terraform** >= 1.0
2. **AWS CLI** configured with appropriate credentials
3. **AWS Account** with permissions for VPC, ECS, RDS, S3, IAM, etc.

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables

Review and update the environment-specific tfvars file:

```bash
# Edit environments/staging.tfvars or environments/production.tfvars
```

Key variables to configure:
- `alarm_email` - Email for CloudWatch alarm notifications
- `acm_certificate_arn` - ACM certificate ARN for HTTPS (optional)
- OAuth credentials (Google, Azure) via environment variables

### 3. Plan and Apply

```bash
# Staging
terraform plan -var-file="environments/staging.tfvars" -out=tfplan
terraform apply tfplan

# Production
terraform plan -var-file="environments/production.tfvars" -out=tfplan
terraform apply tfplan
```

### 4. View Outputs

```bash
terraform output
terraform output -json > outputs.json
```

## Remote State Configuration

For production use, configure S3 backend for state management:

1. Create S3 bucket and DynamoDB table:

```bash
# Create S3 bucket
aws s3api create-bucket --bucket agent-builder-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning --bucket agent-builder-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name agent-builder-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

2. Uncomment the backend configuration in `main.tf` or `backend.tf`

3. Re-initialize Terraform:
```bash
terraform init -reconfigure
```

## Environment-Specific Deployments

### Staging

```bash
terraform workspace new staging
terraform apply -var-file="environments/staging.tfvars"
```

Staging characteristics:
- Single NAT Gateway (cost savings)
- Smaller RDS instance (db.t3.small)
- Fewer ECS tasks (1 each)
- ECS Exec enabled for debugging
- 3-day log retention

### Production

```bash
terraform workspace new production
terraform apply -var-file="environments/production.tfvars"
```

Production characteristics:
- NAT Gateway per AZ (high availability)
- Multi-AZ RDS (db.t3.medium)
- 2-4 ECS tasks with auto-scaling
- Deletion protection enabled
- 7-day log retention

## Module Reference

### VPC Module

Creates VPC, subnets, NAT gateways, and route tables.

```hcl
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = false  # true for cost savings
  enable_flow_logs     = true
}
```

### RDS Module

Creates PostgreSQL 15 with automated backups and monitoring.

```hcl
module "rds" {
  source = "./modules/rds"

  instance_class          = "db.t3.medium"
  allocated_storage       = 20
  multi_az                = true
  backup_retention_period = 7
}
```

### ECS Module

Creates ECS cluster, task definitions, services, and auto-scaling.

```hcl
module "ecs" {
  source = "./modules/ecs"

  backend_cpu          = 512
  backend_memory       = 1024
  backend_desired_count = 2
  backend_min_count    = 2
  backend_max_count    = 4
}
```

## Security

### Secrets Management

Secrets are stored in SSM Parameter Store:

- `/agent-builder-{env}/secrets/jwt` - JWT signing secret
- `/agent-builder-{env}/secrets/encryption-key` - Encryption key
- `/agent-builder-{env}/database/url` - Database connection URL
- `/agent-builder-{env}/database/password` - Database password
- `/agent-builder-{env}/oauth/google/*` - Google OAuth credentials
- `/agent-builder-{env}/oauth/azure/*` - Azure AD credentials

### Security Groups

Principle of least privilege:

- **ALB**: Allows 80/443 from anywhere
- **ECS Backend**: Allows 3000 from ALB only
- **ECS Frontend**: Allows 80 from ALB only
- **RDS**: Allows 5432 from ECS backend only

### Network Isolation

- ECS tasks run in private subnets
- RDS in private subnets (not publicly accessible)
- NAT Gateways for outbound internet access
- VPC Flow Logs for network monitoring

## Monitoring

### CloudWatch Dashboard

Access the dashboard URL from outputs:

```bash
terraform output cloudwatch_dashboard_url
```

### Alarms

Configured alarms:
- ECS CPU > 80%
- ECS Memory > 80%
- RDS CPU > 80%
- RDS Connections > 100
- RDS Storage < 5GB
- ALB 5XX errors > 5
- Unhealthy hosts > 0

### Logs

View logs:

```bash
# Backend logs
aws logs tail /ecs/agent-builder-production/backend --follow

# Frontend logs
aws logs tail /ecs/agent-builder-production/frontend --follow
```

## Troubleshooting

### State Issues

```bash
# Refresh state
terraform refresh -var-file="environments/production.tfvars"

# Import existing resource
terraform import module.vpc.aws_vpc.main vpc-xxxxxxxx
```

### Unlock State

```bash
terraform force-unlock <lock-id>
```

### Taint Resource

```bash
terraform taint module.ecs.aws_ecs_service.backend
terraform apply -var-file="environments/production.tfvars"
```

## Cost Optimization

Estimated monthly costs (us-east-1):

| Resource | Staging | Production |
|----------|---------|------------|
| ECS Fargate | ~$20 | ~$45 |
| NAT Gateway | ~$35 | ~$70 |
| RDS | ~$30 | ~$50 |
| ALB | ~$20 | ~$20 |
| S3 | ~$2 | ~$5 |
| CloudWatch | ~$5 | ~$10 |
| **Total** | **~$112** | **~$200** |

Cost saving tips:
- Use single NAT Gateway in non-production
- Use smaller RDS instance in staging
- Set aggressive log retention
- Consider Reserved Instances for stable workloads

## Cleanup

To destroy all resources:

```bash
# Staging
terraform destroy -var-file="environments/staging.tfvars"

# Production (requires confirmation)
terraform destroy -var-file="environments/production.tfvars"
```

**Warning**: Production has deletion protection enabled. You must first:
1. Disable deletion protection on RDS
2. Disable deletion protection on ALB
3. Then run destroy
