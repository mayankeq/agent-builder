# =============================================================================
# Staging Environment Configuration
# =============================================================================

environment  = "staging"
project_name = "agent-builder"
owner        = "platform-team"
aws_region   = "us-east-1"

# VPC Configuration
vpc_cidr              = "10.1.0.0/16"
public_subnet_cidrs   = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs  = ["10.1.10.0/24", "10.1.20.0/24"]
enable_vpc_flow_logs  = true

# RDS Configuration
db_name                    = "agentbuilder"
db_username                = "agentbuilder_admin"
db_instance_class          = "db.t3.small"
db_allocated_storage       = 20
db_max_allocated_storage   = 50
db_backup_retention_period = 3

# S3 Configuration
s3_lifecycle_expiration_days = 3
s3_enable_versioning         = true
cors_allowed_origins         = ["*"]

# ECS Configuration
backend_cpu     = 256
backend_memory  = 512
frontend_cpu    = 256
frontend_memory = 512

backend_desired_count  = 1
frontend_desired_count = 1
backend_min_count      = 1
backend_max_count      = 2
frontend_min_count     = 1
frontend_max_count     = 2

enable_ecs_execute_command = true

# CloudWatch Configuration
log_retention_days    = 3
cpu_threshold_high    = 85
memory_threshold_high = 85
error_rate_threshold  = 10

# Alarm notification email (update this)
alarm_email = ""

# ACM Certificate ARN (update this for HTTPS)
acm_certificate_arn = ""
