# =============================================================================
# CloudWatch Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# SNS Topic for Alarms
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alarms" {
  name = "${var.name_prefix}-alarms"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# -----------------------------------------------------------------------------
# ECS CPU Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${var.name_prefix}-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold_high
  alarm_description   = "Backend CPU utilization is above ${var.cpu_threshold_high}%"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_backend_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "frontend_cpu_high" {
  alarm_name          = "${var.name_prefix}-frontend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold_high
  alarm_description   = "Frontend CPU utilization is above ${var.cpu_threshold_high}%"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_frontend_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# ECS Memory Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "backend_memory_high" {
  alarm_name          = "${var.name_prefix}-backend-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_threshold_high
  alarm_description   = "Backend memory utilization is above ${var.memory_threshold_high}%"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_backend_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "frontend_memory_high" {
  alarm_name          = "${var.name_prefix}-frontend-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_threshold_high
  alarm_description   = "Frontend memory utilization is above ${var.memory_threshold_high}%"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_frontend_service_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# RDS Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold_high
  alarm_description   = "RDS CPU utilization is above ${var.cpu_threshold_high}%"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.name_prefix}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "RDS connection count is above 100"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120 # 5 GB in bytes
  alarm_description   = "RDS free storage space is below 5 GB"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# ALB Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_rate_threshold
  alarm_description   = "ALB 5XX error count is above ${var.error_rate_threshold}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-target-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_rate_threshold
  alarm_description   = "Target 5XX error count is above ${var.error_rate_threshold}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.backend_tg_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "backend_unhealthy_hosts" {
  alarm_name          = "${var.name_prefix}-backend-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Backend has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.backend_tg_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "frontend_unhealthy_hosts" {
  alarm_name          = "${var.name_prefix}-frontend-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Frontend has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.frontend_tg_arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# ${var.name_prefix} Infrastructure Dashboard"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 12
        height = 6
        properties = {
          title   = "ECS Backend CPU Utilization"
          region  = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_backend_service_name]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 1
        width  = 12
        height = 6
        properties = {
          title   = "ECS Backend Memory Utilization"
          region  = var.aws_region
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_backend_service_name]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 12
        height = 6
        properties = {
          title   = "ECS Frontend CPU Utilization"
          region  = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_frontend_service_name]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 7
        width  = 12
        height = 6
        properties = {
          title   = "ECS Frontend Memory Utilization"
          region  = var.aws_region
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_frontend_service_name]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 13
        width  = 8
        height = 6
        properties = {
          title   = "RDS CPU Utilization"
          region  = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 13
        width  = 8
        height = 6
        properties = {
          title   = "RDS Database Connections"
          region  = var.aws_region
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 13
        width  = 8
        height = 6
        properties = {
          title   = "RDS Free Storage Space"
          region  = var.aws_region
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_instance_id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 19
        width  = 12
        height = 6
        properties = {
          title   = "ALB Request Count"
          region  = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix]
          ]
          period = 60
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 19
        width  = 12
        height = 6
        properties = {
          title   = "ALB HTTP Error Codes"
          region  = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", "LoadBalancer", var.alb_arn_suffix],
            [".", "HTTPCode_ELB_5XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 25
        width  = 12
        height = 6
        properties = {
          title   = "Backend Target Response Time"
          region  = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, "TargetGroup", var.backend_tg_arn_suffix]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 25
        width  = 12
        height = 6
        properties = {
          title   = "Healthy/Unhealthy Host Count"
          region  = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "LoadBalancer", var.alb_arn_suffix, "TargetGroup", var.backend_tg_arn_suffix],
            [".", "UnHealthyHostCount", ".", ".", ".", "."],
            [".", "HealthyHostCount", ".", ".", "TargetGroup", var.frontend_tg_arn_suffix],
            [".", "UnHealthyHostCount", ".", ".", ".", "."]
          ]
          period = 60
          stat   = "Average"
        }
      }
    ]
  })
}
