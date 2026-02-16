# =============================================================================
# ALB Module - Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ALB"
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

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "health_check_path_backend" {
  description = "Health check path for backend"
  type        = string
  default     = "/health"
}

variable "health_check_path_frontend" {
  description = "Health check path for frontend"
  type        = string
  default     = "/"
}

variable "access_logs_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
