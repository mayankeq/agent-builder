# =============================================================================
# ALB Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------

resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"
  enable_http2               = true

  access_logs {
    bucket  = var.access_logs_bucket
    prefix  = "alb-logs"
    enabled = var.access_logs_bucket != ""
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb"
  })
}

# -----------------------------------------------------------------------------
# Backend Target Group
# -----------------------------------------------------------------------------

resource "aws_lb_target_group" "backend" {
  name        = "${var.name_prefix}-backend-tg"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path_backend
    protocol            = "HTTP"
    matcher             = "200-299"
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-backend-tg"
  })
}

# -----------------------------------------------------------------------------
# Frontend Target Group
# -----------------------------------------------------------------------------

resource "aws_lb_target_group" "frontend" {
  name        = "${var.name_prefix}-frontend-tg"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path_frontend
    protocol            = "HTTP"
    matcher             = "200-299"
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend-tg"
  })
}

# -----------------------------------------------------------------------------
# HTTP Listener (Redirect to HTTPS)
# -----------------------------------------------------------------------------

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    # Forward to frontend if no certificate (HTTP only mode)
    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.frontend.arn : null
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# HTTPS Listener (Only if certificate provided)
# -----------------------------------------------------------------------------

resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Listener Rules - Route /api/* to Backend
# -----------------------------------------------------------------------------

resource "aws_lb_listener_rule" "backend_api" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/metrics", "/ws/*"]
    }
  }

  tags = var.tags
}

# HTTP rule for backend (when no certificate)
resource "aws_lb_listener_rule" "backend_api_http" {
  count = var.certificate_arn == "" ? 1 : 0

  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/metrics", "/ws/*"]
    }
  }

  tags = var.tags
}
