# =============================================================================
# Agent Builder - Terraform Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

# -----------------------------------------------------------------------------
# RDS Outputs
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "rds_port" {
  description = "RDS database port"
  value       = module.rds.db_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

# -----------------------------------------------------------------------------
# S3 Outputs
# -----------------------------------------------------------------------------

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3.bucket_arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = module.s3.bucket_domain_name
}

# -----------------------------------------------------------------------------
# ECS Outputs
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "ecs_backend_service_name" {
  description = "Name of the backend ECS service"
  value       = module.ecs.backend_service_name
}

output "ecs_frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = module.ecs.frontend_service_name
}

output "ecr_backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = module.ecs.backend_repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = module.ecs.frontend_repository_url
}

# -----------------------------------------------------------------------------
# ALB Outputs
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.alb.alb_zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

output "application_url" {
  description = "URL to access the application"
  value       = var.acm_certificate_arn != "" ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"
}

# -----------------------------------------------------------------------------
# SSM Parameter Store Outputs
# -----------------------------------------------------------------------------

output "ssm_parameter_prefix" {
  description = "Prefix for SSM parameters"
  value       = module.ssm.parameter_prefix
}

# -----------------------------------------------------------------------------
# CloudWatch Outputs
# -----------------------------------------------------------------------------

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = module.cloudwatch.dashboard_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = module.cloudwatch.sns_topic_arn
}

# -----------------------------------------------------------------------------
# Security Group Outputs
# -----------------------------------------------------------------------------

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = module.security_groups.alb_security_group_id
}

output "ecs_backend_security_group_id" {
  description = "Security group ID for ECS backend"
  value       = module.security_groups.ecs_backend_security_group_id
}

output "ecs_frontend_security_group_id" {
  description = "Security group ID for ECS frontend"
  value       = module.security_groups.ecs_frontend_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = module.security_groups.rds_security_group_id
}

# -----------------------------------------------------------------------------
# Summary Output
# -----------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment     = var.environment
    region          = var.aws_region
    application_url = var.acm_certificate_arn != "" ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"
    database        = module.rds.db_endpoint
    s3_bucket       = module.s3.bucket_name
    ecs_cluster     = module.ecs.cluster_name
    dashboard       = module.cloudwatch.dashboard_url
  }
}
