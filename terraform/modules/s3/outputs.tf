# =============================================================================
# S3 Module - Outputs
# =============================================================================

output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "logs_bucket_name" {
  description = "Name of the logging bucket"
  value       = var.enable_logging ? aws_s3_bucket.logs[0].bucket : null
}

output "logs_bucket_arn" {
  description = "ARN of the logging bucket"
  value       = var.enable_logging ? aws_s3_bucket.logs[0].arn : null
}
