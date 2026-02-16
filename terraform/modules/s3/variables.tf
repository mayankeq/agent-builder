# =============================================================================
# S3 Module - Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lifecycle_expiration_days" {
  description = "Number of days before objects expire"
  type        = number
  default     = 7
}

variable "enable_versioning" {
  description = "Enable bucket versioning"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "enable_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
