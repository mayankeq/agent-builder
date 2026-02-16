# =============================================================================
# Agent Builder - Main Terraform Configuration
# =============================================================================
# Production-ready AWS infrastructure for agent-builder deployment
# with ECS Fargate, RDS PostgreSQL, S3, and comprehensive monitoring
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state configuration - uncomment and configure for production
  # backend "s3" {
  #   bucket         = "agent-builder-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "agent-builder-terraform-locks"
  # }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "agent-builder"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.owner
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Random Resources
# =============================================================================

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

# =============================================================================
# Local Values
# =============================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Container configurations
  backend_container_name  = "agent-builder-backend"
  frontend_container_name = "agent-builder-frontend"

  # Port configurations
  backend_port  = 3000
  frontend_port = 80
}

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = local.azs
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"

  enable_flow_logs   = var.enable_vpc_flow_logs
  flow_logs_retention = var.log_retention_days

  tags = local.common_tags
}

# =============================================================================
# Security Groups Module
# =============================================================================

module "security_groups" {
  source = "./modules/security-groups"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  vpc_cidr          = var.vpc_cidr
  backend_port      = local.backend_port
  frontend_port     = local.frontend_port
  database_port     = 5432

  tags = local.common_tags
}

# =============================================================================
# S3 Module
# =============================================================================

module "s3" {
  source = "./modules/s3"

  name_prefix              = local.name_prefix
  environment              = var.environment
  lifecycle_expiration_days = var.s3_lifecycle_expiration_days
  enable_versioning        = var.s3_enable_versioning

  cors_allowed_origins = var.cors_allowed_origins

  tags = local.common_tags
}

# =============================================================================
# RDS Module
# =============================================================================

module "rds" {
  source = "./modules/rds"

  name_prefix          = local.name_prefix
  environment          = var.environment

  vpc_id               = module.vpc.vpc_id
  subnet_ids           = module.vpc.private_subnet_ids
  security_group_id    = module.security_groups.rds_security_group_id

  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = random_password.db_password.result

  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  multi_az             = var.environment == "production"
  backup_retention_period = var.db_backup_retention_period

  deletion_protection  = var.environment == "production"
  skip_final_snapshot  = var.environment != "production"

  tags = local.common_tags
}

# =============================================================================
# SSM Parameter Store Module
# =============================================================================

module "ssm" {
  source = "./modules/ssm"

  name_prefix     = local.name_prefix
  environment     = var.environment

  jwt_secret      = random_password.jwt_secret.result
  encryption_key  = random_password.encryption_key.result

  db_host         = module.rds.db_endpoint
  db_port         = module.rds.db_port
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = random_password.db_password.result

  s3_bucket_name  = module.s3.bucket_name
  s3_bucket_arn   = module.s3.bucket_arn

  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  azure_client_id      = var.azure_client_id
  azure_client_secret  = var.azure_client_secret
  azure_tenant_id      = var.azure_tenant_id

  tags = local.common_tags
}

# =============================================================================
# ALB Module
# =============================================================================

module "alb" {
  source = "./modules/alb"

  name_prefix        = local.name_prefix
  environment        = var.environment

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_security_group_id

  backend_port       = local.backend_port
  frontend_port      = local.frontend_port

  certificate_arn    = var.acm_certificate_arn

  health_check_path_backend  = "/health"
  health_check_path_frontend = "/"

  tags = local.common_tags
}

# =============================================================================
# ECS Module
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  name_prefix = local.name_prefix
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids

  backend_security_group_id  = module.security_groups.ecs_backend_security_group_id
  frontend_security_group_id = module.security_groups.ecs_frontend_security_group_id

  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn

  backend_container_name  = local.backend_container_name
  frontend_container_name = local.frontend_container_name
  backend_port            = local.backend_port
  frontend_port           = local.frontend_port

  backend_image  = var.backend_image
  frontend_image = var.frontend_image

  backend_cpu     = var.backend_cpu
  backend_memory  = var.backend_memory
  frontend_cpu    = var.frontend_cpu
  frontend_memory = var.frontend_memory

  backend_desired_count  = var.backend_desired_count
  frontend_desired_count = var.frontend_desired_count
  backend_min_count      = var.backend_min_count
  backend_max_count      = var.backend_max_count
  frontend_min_count     = var.frontend_min_count
  frontend_max_count     = var.frontend_max_count

  ssm_parameter_arns = module.ssm.parameter_arns
  s3_bucket_arn      = module.s3.bucket_arn

  log_retention_days = var.log_retention_days

  enable_execute_command = var.enable_ecs_execute_command

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Module
# =============================================================================

module "cloudwatch" {
  source = "./modules/cloudwatch"

  name_prefix = local.name_prefix
  environment = var.environment
  aws_region  = var.aws_region

  ecs_cluster_name         = module.ecs.cluster_name
  ecs_backend_service_name = module.ecs.backend_service_name
  ecs_frontend_service_name = module.ecs.frontend_service_name

  rds_instance_id = module.rds.db_instance_id

  alb_arn_suffix         = module.alb.alb_arn_suffix
  backend_tg_arn_suffix  = module.alb.backend_target_group_arn_suffix
  frontend_tg_arn_suffix = module.alb.frontend_target_group_arn_suffix

  alarm_email = var.alarm_email

  cpu_threshold_high     = var.cpu_threshold_high
  memory_threshold_high  = var.memory_threshold_high
  error_rate_threshold   = var.error_rate_threshold

  tags = local.common_tags
}
