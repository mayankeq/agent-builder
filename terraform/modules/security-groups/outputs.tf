# =============================================================================
# Security Groups Module - Outputs
# =============================================================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_backend_security_group_id" {
  description = "ID of the ECS backend security group"
  value       = aws_security_group.ecs_backend.id
}

output "ecs_frontend_security_group_id" {
  description = "ID of the ECS frontend security group"
  value       = aws_security_group.ecs_frontend.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "alb_security_group_arn" {
  description = "ARN of the ALB security group"
  value       = aws_security_group.alb.arn
}

output "ecs_backend_security_group_arn" {
  description = "ARN of the ECS backend security group"
  value       = aws_security_group.ecs_backend.arn
}

output "ecs_frontend_security_group_arn" {
  description = "ARN of the ECS frontend security group"
  value       = aws_security_group.ecs_frontend.arn
}

output "rds_security_group_arn" {
  description = "ARN of the RDS security group"
  value       = aws_security_group.rds.arn
}
