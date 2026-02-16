# =============================================================================
# CloudWatch Module - Outputs
# =============================================================================

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = {
    backend_cpu_high        = aws_cloudwatch_metric_alarm.backend_cpu_high.arn
    frontend_cpu_high       = aws_cloudwatch_metric_alarm.frontend_cpu_high.arn
    backend_memory_high     = aws_cloudwatch_metric_alarm.backend_memory_high.arn
    frontend_memory_high    = aws_cloudwatch_metric_alarm.frontend_memory_high.arn
    rds_cpu_high            = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
    rds_connections_high    = aws_cloudwatch_metric_alarm.rds_connections_high.arn
    rds_storage_low         = aws_cloudwatch_metric_alarm.rds_storage_low.arn
    alb_5xx_errors          = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
    alb_target_5xx_errors   = aws_cloudwatch_metric_alarm.alb_target_5xx_errors.arn
    backend_unhealthy_hosts = aws_cloudwatch_metric_alarm.backend_unhealthy_hosts.arn
    frontend_unhealthy_hosts = aws_cloudwatch_metric_alarm.frontend_unhealthy_hosts.arn
  }
}
