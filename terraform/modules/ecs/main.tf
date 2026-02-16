# =============================================================================
# ECS Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "backend" {
  name                 = "${var.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-backend"
  })
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.name_prefix}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend"
  })
}

# ECR Lifecycle Policies
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cluster"
  })
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.name_prefix}/backend"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.name_prefix}/frontend"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# -----------------------------------------------------------------------------
# IAM Roles
# -----------------------------------------------------------------------------

# Task Execution Role
resource "aws_iam_role" "task_execution" {
  name = "${var.name_prefix}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "task_execution_policy" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy for SSM Parameter access
resource "aws_iam_role_policy" "task_execution_ssm" {
  name = "${var.name_prefix}-task-execution-ssm"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = var.ssm_parameter_arns
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Task Role (for application permissions)
resource "aws_iam_role" "task" {
  name = "${var.name_prefix}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# S3 Access Policy
resource "aws_iam_role_policy" "task_s3" {
  name = "${var.name_prefix}-task-s3"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

# ECS Exec Policy (for debugging)
resource "aws_iam_role_policy" "task_exec" {
  count = var.enable_execute_command ? 1 : 0
  name  = "${var.name_prefix}-task-exec"
  role  = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Backend Task Definition
# -----------------------------------------------------------------------------

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.backend_container_name
      image     = var.backend_image
      essential = true

      portMappings = [
        {
          containerPort = var.backend_port
          hostPort      = var.backend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.backend_port)
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/database/url"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/secrets/jwt"
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/secrets/encryption-key"
        },
        {
          name      = "S3_BUCKET"
          valueFrom = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.name_prefix}/s3/bucket-name"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.backend_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Frontend Task Definition
# -----------------------------------------------------------------------------

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.name_prefix}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.frontend_container_name
      image     = var.frontend_image
      essential = true

      portMappings = [
        {
          containerPort = var.frontend_port
          hostPort      = var.frontend_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NGINX_PORT"
          value = tostring(var.frontend_port)
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.frontend_port}/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Backend ECS Service
# -----------------------------------------------------------------------------

resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  enable_execute_command = var.enable_execute_command

  network_configuration {
    security_groups  = [var.backend_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = var.backend_container_name
    container_port   = var.backend_port
  }

  deployment_configuration {
    minimum_healthy_percent = 50
    maximum_percent         = 200

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Frontend ECS Service
# -----------------------------------------------------------------------------

resource "aws_ecs_service" "frontend" {
  name            = "${var.name_prefix}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  enable_execute_command = var.enable_execute_command

  network_configuration {
    security_groups  = [var.frontend_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.frontend_target_group_arn
    container_name   = var.frontend_container_name
    container_port   = var.frontend_port
  }

  deployment_configuration {
    minimum_healthy_percent = 50
    maximum_percent         = 200

    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Auto Scaling
# -----------------------------------------------------------------------------

# Backend Auto Scaling Target
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_count
  min_capacity       = var.backend_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Backend CPU Scaling Policy
resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${var.name_prefix}-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Backend Memory Scaling Policy
resource "aws_appautoscaling_policy" "backend_memory" {
  name               = "${var.name_prefix}-backend-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Frontend Auto Scaling Target
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.frontend_max_count
  min_capacity       = var.frontend_min_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Frontend CPU Scaling Policy
resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${var.name_prefix}-frontend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}
