# =============================================================================
# Security Groups Module - Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
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

variable "database_port" {
  description = "Port for database"
  type        = number
  default     = 5432
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
