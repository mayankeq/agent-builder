# =============================================================================
# Security Groups Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# ALB Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow HTTP traffic"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-alb-http"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow HTTPS traffic"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-alb-https"
  }
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-alb-egress"
  }
}

# -----------------------------------------------------------------------------
# ECS Backend Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "ecs_backend" {
  name        = "${var.name_prefix}-ecs-backend-sg"
  description = "Security group for ECS backend service"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-backend-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_backend_from_alb" {
  security_group_id            = aws_security_group.ecs_backend.id
  description                  = "Allow traffic from ALB"
  from_port                    = var.backend_port
  to_port                      = var.backend_port
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.alb.id

  tags = {
    Name = "${var.name_prefix}-ecs-backend-from-alb"
  }
}

resource "aws_vpc_security_group_egress_rule" "ecs_backend_all" {
  security_group_id = aws_security_group.ecs_backend.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-ecs-backend-egress"
  }
}

# -----------------------------------------------------------------------------
# ECS Frontend Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "ecs_frontend" {
  name        = "${var.name_prefix}-ecs-frontend-sg"
  description = "Security group for ECS frontend service"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-frontend-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_frontend_from_alb" {
  security_group_id            = aws_security_group.ecs_frontend.id
  description                  = "Allow traffic from ALB"
  from_port                    = var.frontend_port
  to_port                      = var.frontend_port
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.alb.id

  tags = {
    Name = "${var.name_prefix}-ecs-frontend-from-alb"
  }
}

resource "aws_vpc_security_group_egress_rule" "ecs_frontend_all" {
  security_group_id = aws_security_group.ecs_frontend.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-ecs-frontend-egress"
  }
}

# -----------------------------------------------------------------------------
# RDS Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_backend" {
  security_group_id            = aws_security_group.rds.id
  description                  = "Allow PostgreSQL traffic from ECS backend"
  from_port                    = var.database_port
  to_port                      = var.database_port
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.ecs_backend.id

  tags = {
    Name = "${var.name_prefix}-rds-from-backend"
  }
}

# Allow from VPC CIDR for migrations and maintenance
resource "aws_vpc_security_group_ingress_rule" "rds_from_vpc" {
  security_group_id = aws_security_group.rds.id
  description       = "Allow PostgreSQL traffic from VPC"
  from_port         = var.database_port
  to_port           = var.database_port
  ip_protocol       = "tcp"
  cidr_ipv4         = var.vpc_cidr

  tags = {
    Name = "${var.name_prefix}-rds-from-vpc"
  }
}

resource "aws_vpc_security_group_egress_rule" "rds_all" {
  security_group_id = aws_security_group.rds.id
  description       = "Allow all outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = {
    Name = "${var.name_prefix}-rds-egress"
  }
}
