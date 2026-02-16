# =============================================================================
# SSM Parameter Store Module - Outputs
# =============================================================================

output "parameter_prefix" {
  description = "Prefix for all SSM parameters"
  value       = "/${var.name_prefix}"
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret parameter"
  value       = aws_ssm_parameter.jwt_secret.arn
}

output "encryption_key_arn" {
  description = "ARN of the encryption key parameter"
  value       = aws_ssm_parameter.encryption_key.arn
}

output "database_url_arn" {
  description = "ARN of the database URL parameter"
  value       = aws_ssm_parameter.database_url.arn
}

output "s3_bucket_name_arn" {
  description = "ARN of the S3 bucket name parameter"
  value       = aws_ssm_parameter.s3_bucket_name.arn
}

output "parameter_arns" {
  description = "List of all parameter ARNs"
  value = concat(
    [
      aws_ssm_parameter.jwt_secret.arn,
      aws_ssm_parameter.encryption_key.arn,
      aws_ssm_parameter.db_host.arn,
      aws_ssm_parameter.db_port.arn,
      aws_ssm_parameter.db_name.arn,
      aws_ssm_parameter.db_username.arn,
      aws_ssm_parameter.db_password.arn,
      aws_ssm_parameter.database_url.arn,
      aws_ssm_parameter.s3_bucket_name.arn,
      aws_ssm_parameter.s3_bucket_arn.arn,
    ],
    var.google_client_id != "" ? [aws_ssm_parameter.google_client_id[0].arn] : [],
    var.google_client_secret != "" ? [aws_ssm_parameter.google_client_secret[0].arn] : [],
    var.azure_client_id != "" ? [aws_ssm_parameter.azure_client_id[0].arn] : [],
    var.azure_client_secret != "" ? [aws_ssm_parameter.azure_client_secret[0].arn] : [],
    var.azure_tenant_id != "" ? [aws_ssm_parameter.azure_tenant_id[0].arn] : []
  )
}

output "parameter_names" {
  description = "Map of parameter names"
  value = {
    jwt_secret      = aws_ssm_parameter.jwt_secret.name
    encryption_key  = aws_ssm_parameter.encryption_key.name
    database_url    = aws_ssm_parameter.database_url.name
    db_host         = aws_ssm_parameter.db_host.name
    db_port         = aws_ssm_parameter.db_port.name
    db_name         = aws_ssm_parameter.db_name.name
    db_username     = aws_ssm_parameter.db_username.name
    db_password     = aws_ssm_parameter.db_password.name
    s3_bucket_name  = aws_ssm_parameter.s3_bucket_name.name
    s3_bucket_arn   = aws_ssm_parameter.s3_bucket_arn.name
  }
}
