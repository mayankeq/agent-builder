# =============================================================================
# Agent Builder - Terraform Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "agent-builder"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "platform-team"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# VPC Configuration
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# RDS Configuration
# -----------------------------------------------------------------------------

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "agentbuilder"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "agentbuilder_admin"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# -----------------------------------------------------------------------------
# S3 Configuration
# -----------------------------------------------------------------------------

variable "s3_lifecycle_expiration_days" {
  description = "Number of days before S3 objects expire"
  type        = number
  default     = 7
}

variable "s3_enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

# -----------------------------------------------------------------------------
# ECS Configuration
# -----------------------------------------------------------------------------

variable "backend_image" {
  description = "Docker image for backend service"
  type        = string
  default     = "nginx:latest" # Placeholder - will be replaced by CI/CD
}

variable "frontend_image" {
  description = "Docker image for frontend service"
  type        = string
  default     = "nginx:latest" # Placeholder - will be replaced by CI/CD
}

variable "backend_cpu" {
  description = "CPU units for backend task (1 vCPU = 1024)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory in MB for backend task"
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory in MB for frontend task"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 2
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 2
}

variable "backend_min_count" {
  description = "Minimum number of backend tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "backend_max_count" {
  description = "Maximum number of backend tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "frontend_min_count" {
  description = "Minimum number of frontend tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "frontend_max_count" {
  description = "Maximum number of frontend tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "enable_ecs_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

# -----------------------------------------------------------------------------
# ALB Configuration
# -----------------------------------------------------------------------------

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# CloudWatch Configuration
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "cpu_threshold_high" {
  description = "CPU utilization threshold for alarms (%)"
  type        = number
  default     = 80
}

variable "memory_threshold_high" {
  description = "Memory utilization threshold for alarms (%)"
  type        = number
  default     = 80
}

variable "error_rate_threshold" {
  description = "Error rate threshold for ALB alarms"
  type        = number
  default     = 5
}

# -----------------------------------------------------------------------------
# OAuth Configuration (Sensitive)
# -----------------------------------------------------------------------------

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "azure_client_id" {
  description = "Azure AD OAuth client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "azure_client_secret" {
  description = "Azure AD OAuth client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "azure_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  default     = ""
  sensitive   = true
}
