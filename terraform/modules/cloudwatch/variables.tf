# =============================================================================
# CloudWatch Module - Variables
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

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_backend_service_name" {
  description = "Name of the backend ECS service"
  type        = string
}

variable "ecs_frontend_service_name" {
  description = "Name of the frontend ECS service"
  type        = string
}

variable "rds_instance_id" {
  description = "ID of the RDS instance"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  type        = string
}

variable "backend_tg_arn_suffix" {
  description = "ARN suffix of the backend target group"
  type        = string
}

variable "frontend_tg_arn_suffix" {
  description = "ARN suffix of the frontend target group"
  type        = string
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

variable "cpu_threshold_high" {
  description = "CPU utilization threshold for alarms"
  type        = number
  default     = 80
}

variable "memory_threshold_high" {
  description = "Memory utilization threshold for alarms"
  type        = number
  default     = 80
}

variable "error_rate_threshold" {
  description = "Error rate threshold for ALB alarms"
  type        = number
  default     = 5
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
