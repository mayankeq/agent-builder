# =============================================================================
# ECS Module - Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "backend_security_group_id" {
  description = "Security group ID for backend service"
  type        = string
}

variable "frontend_security_group_id" {
  description = "Security group ID for frontend service"
  type        = string
}

variable "backend_target_group_arn" {
  description = "Target group ARN for backend"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "Target group ARN for frontend"
  type        = string
}

variable "backend_container_name" {
  description = "Name of the backend container"
  type        = string
}

variable "frontend_container_name" {
  description = "Name of the frontend container"
  type        = string
}

variable "backend_port" {
  description = "Port for backend service"
  type        = number
  default     = 3000
}

variable "frontend_port" {
  description = "Port for frontend service"
  type        = number
  default     = 80
}

variable "backend_image" {
  description = "Docker image for backend"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for frontend"
  type        = string
}

variable "backend_cpu" {
  description = "CPU units for backend task"
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
  description = "Minimum number of backend tasks"
  type        = number
  default     = 2
}

variable "backend_max_count" {
  description = "Maximum number of backend tasks"
  type        = number
  default     = 4
}

variable "frontend_min_count" {
  description = "Minimum number of frontend tasks"
  type        = number
  default     = 2
}

variable "frontend_max_count" {
  description = "Maximum number of frontend tasks"
  type        = number
  default     = 4
}

variable "ssm_parameter_arns" {
  description = "ARNs of SSM parameters for secrets"
  type        = list(string)
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
