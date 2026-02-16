# =============================================================================
# SSM Parameter Store Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# JWT Secret
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.name_prefix}/secrets/jwt"
  description = "JWT signing secret for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.jwt_secret

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Encryption Key
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "encryption_key" {
  name        = "/${var.name_prefix}/secrets/encryption-key"
  description = "Encryption key for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.encryption_key

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "db_host" {
  name        = "/${var.name_prefix}/database/host"
  description = "Database host for ${var.name_prefix}"
  type        = "String"
  value       = split(":", var.db_host)[0]

  tags = var.tags
}

resource "aws_ssm_parameter" "db_port" {
  name        = "/${var.name_prefix}/database/port"
  description = "Database port for ${var.name_prefix}"
  type        = "String"
  value       = tostring(var.db_port)

  tags = var.tags
}

resource "aws_ssm_parameter" "db_name" {
  name        = "/${var.name_prefix}/database/name"
  description = "Database name for ${var.name_prefix}"
  type        = "String"
  value       = var.db_name

  tags = var.tags
}

resource "aws_ssm_parameter" "db_username" {
  name        = "/${var.name_prefix}/database/username"
  description = "Database username for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.db_username

  tags = var.tags
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.name_prefix}/database/password"
  description = "Database password for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.db_password

  tags = var.tags
}

resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.name_prefix}/database/url"
  description = "Database connection URL for ${var.name_prefix}"
  type        = "SecureString"
  value       = "postgresql://${var.db_username}:${var.db_password}@${var.db_host}/${var.db_name}"

  tags = var.tags
}

# -----------------------------------------------------------------------------
# S3 Configuration
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "s3_bucket_name" {
  name        = "/${var.name_prefix}/s3/bucket-name"
  description = "S3 bucket name for ${var.name_prefix}"
  type        = "String"
  value       = var.s3_bucket_name

  tags = var.tags
}

resource "aws_ssm_parameter" "s3_bucket_arn" {
  name        = "/${var.name_prefix}/s3/bucket-arn"
  description = "S3 bucket ARN for ${var.name_prefix}"
  type        = "String"
  value       = var.s3_bucket_arn

  tags = var.tags
}

# -----------------------------------------------------------------------------
# OAuth Configuration (Google)
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "google_client_id" {
  count = var.google_client_id != "" ? 1 : 0

  name        = "/${var.name_prefix}/oauth/google/client-id"
  description = "Google OAuth client ID for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.google_client_id

  tags = var.tags
}

resource "aws_ssm_parameter" "google_client_secret" {
  count = var.google_client_secret != "" ? 1 : 0

  name        = "/${var.name_prefix}/oauth/google/client-secret"
  description = "Google OAuth client secret for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.google_client_secret

  tags = var.tags
}

# -----------------------------------------------------------------------------
# OAuth Configuration (Azure AD)
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "azure_client_id" {
  count = var.azure_client_id != "" ? 1 : 0

  name        = "/${var.name_prefix}/oauth/azure/client-id"
  description = "Azure AD OAuth client ID for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.azure_client_id

  tags = var.tags
}

resource "aws_ssm_parameter" "azure_client_secret" {
  count = var.azure_client_secret != "" ? 1 : 0

  name        = "/${var.name_prefix}/oauth/azure/client-secret"
  description = "Azure AD OAuth client secret for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.azure_client_secret

  tags = var.tags
}

resource "aws_ssm_parameter" "azure_tenant_id" {
  count = var.azure_tenant_id != "" ? 1 : 0

  name        = "/${var.name_prefix}/oauth/azure/tenant-id"
  description = "Azure AD tenant ID for ${var.name_prefix}"
  type        = "SecureString"
  value       = var.azure_tenant_id

  tags = var.tags
}
