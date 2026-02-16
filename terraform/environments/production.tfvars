# =============================================================================
# Production Environment Configuration
# =============================================================================

environment  = "production"
project_name = "agent-builder"
owner        = "platform-team"
aws_region   = "us-east-1"

# VPC Configuration
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.10.0/24", "10.0.20.0/24"]
enable_vpc_flow_logs  = true

# RDS Configuration
db_name                    = "agentbuilder"
db_username                = "agentbuilder_admin"
db_instance_class          = "db.t3.medium"
db_allocated_storage       = 20
db_max_allocated_storage   = 100
db_backup_retention_period = 7

# S3 Configuration
s3_lifecycle_expiration_days = 7
s3_enable_versioning         = true
cors_allowed_origins         = ["https://your-domain.com"]

# ECS Configuration
backend_cpu     = 512
backend_memory  = 1024
frontend_cpu    = 256
frontend_memory = 512

backend_desired_count  = 2
frontend_desired_count = 2
backend_min_count      = 2
backend_max_count      = 4
frontend_min_count     = 2
frontend_max_count     = 4

enable_ecs_execute_command = false

# CloudWatch Configuration
log_retention_days    = 7
cpu_threshold_high    = 80
memory_threshold_high = 80
error_rate_threshold  = 5

# Alarm notification email (update this)
alarm_email = ""

# ACM Certificate ARN (update this for HTTPS)
acm_certificate_arn = ""
