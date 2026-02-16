#!/bin/bash

# =============================================================================
# Agent Builder - Deployment Helper Script
# =============================================================================
# Usage: ./scripts/deploy.sh [environment] [command]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_DIR/terraform"

# Default values
ENVIRONMENT="${1:-staging}"
COMMAND="${2:-plan}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for required tools
    local tools=("terraform" "aws" "docker" "node")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed"
            exit 1
        fi
    done

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi

    log_success "All prerequisites met"
}

terraform_init() {
    log_info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    terraform init -upgrade
    log_success "Terraform initialized"
}

terraform_plan() {
    log_info "Creating Terraform plan for $ENVIRONMENT..."
    cd "$TERRAFORM_DIR"
    terraform plan \
        -var-file="environments/${ENVIRONMENT}.tfvars" \
        -out="tfplan-${ENVIRONMENT}"
    log_success "Plan created: tfplan-${ENVIRONMENT}"
}

terraform_apply() {
    log_info "Applying Terraform changes to $ENVIRONMENT..."
    cd "$TERRAFORM_DIR"

    if [ ! -f "tfplan-${ENVIRONMENT}" ]; then
        log_warning "No plan file found. Creating plan first..."
        terraform_plan
    fi

    read -p "Do you want to apply the changes? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_warning "Aborting apply"
        exit 0
    fi

    terraform apply "tfplan-${ENVIRONMENT}"
    rm -f "tfplan-${ENVIRONMENT}"
    log_success "Terraform apply completed"
}

terraform_destroy() {
    log_warning "This will destroy all resources in $ENVIRONMENT!"
    read -p "Are you absolutely sure? Type the environment name to confirm: " confirm
    if [ "$confirm" != "$ENVIRONMENT" ]; then
        log_warning "Aborting destroy"
        exit 0
    fi

    cd "$TERRAFORM_DIR"
    terraform destroy \
        -var-file="environments/${ENVIRONMENT}.tfvars"
    log_success "Resources destroyed"
}

terraform_output() {
    log_info "Showing Terraform outputs..."
    cd "$TERRAFORM_DIR"
    terraform output -json
}

build_docker() {
    log_info "Building Docker images..."
    cd "$PROJECT_DIR"

    # Build backend
    docker build -f Dockerfile.backend -t agent-builder-backend:latest .

    # Build frontend
    docker build -f Dockerfile.frontend -t agent-builder-frontend:latest .

    log_success "Docker images built"
}

push_docker() {
    log_info "Pushing Docker images to ECR..."

    # Get ECR repository URLs from Terraform output
    cd "$TERRAFORM_DIR"
    BACKEND_REPO=$(terraform output -raw ecr_backend_repository_url 2>/dev/null || echo "")
    FRONTEND_REPO=$(terraform output -raw ecr_frontend_repository_url 2>/dev/null || echo "")

    if [ -z "$BACKEND_REPO" ] || [ -z "$FRONTEND_REPO" ]; then
        log_error "ECR repository URLs not found. Run terraform apply first."
        exit 1
    fi

    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$(echo $BACKEND_REPO | cut -d'/' -f1)"

    # Tag and push backend
    docker tag agent-builder-backend:latest "$BACKEND_REPO:latest"
    docker push "$BACKEND_REPO:latest"

    # Tag and push frontend
    docker tag agent-builder-frontend:latest "$FRONTEND_REPO:latest"
    docker push "$FRONTEND_REPO:latest"

    log_success "Docker images pushed to ECR"
}

run_migrations() {
    log_info "Running database migrations..."
    cd "$PROJECT_DIR"

    # Get database URL from SSM
    DB_URL=$(aws ssm get-parameter \
        --name "/agent-builder-${ENVIRONMENT}/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text 2>/dev/null || echo "")

    if [ -z "$DB_URL" ]; then
        log_error "Database URL not found in SSM"
        exit 1
    fi

    DATABASE_URL="$DB_URL" npm run migrate:up
    log_success "Migrations completed"
}

deploy_ecs() {
    log_info "Deploying to ECS..."

    # Get cluster and service names
    CLUSTER="agent-builder-${ENVIRONMENT}-cluster"
    BACKEND_SERVICE="agent-builder-${ENVIRONMENT}-backend"
    FRONTEND_SERVICE="agent-builder-${ENVIRONMENT}-frontend"

    # Force new deployment
    aws ecs update-service \
        --cluster "$CLUSTER" \
        --service "$BACKEND_SERVICE" \
        --force-new-deployment \
        --region "$AWS_REGION"

    aws ecs update-service \
        --cluster "$CLUSTER" \
        --service "$FRONTEND_SERVICE" \
        --force-new-deployment \
        --region "$AWS_REGION"

    log_info "Waiting for services to stabilize..."
    aws ecs wait services-stable \
        --cluster "$CLUSTER" \
        --services "$BACKEND_SERVICE" "$FRONTEND_SERVICE" \
        --region "$AWS_REGION"

    log_success "ECS deployment completed"
}

full_deploy() {
    log_info "Starting full deployment to $ENVIRONMENT..."

    check_prerequisites
    terraform_init
    terraform_plan
    terraform_apply
    build_docker
    push_docker
    run_migrations
    deploy_ecs

    log_success "Full deployment completed!"
    terraform_output
}

show_status() {
    log_info "Showing deployment status for $ENVIRONMENT..."

    # Get ALB DNS
    cd "$TERRAFORM_DIR"
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "Not deployed")

    # Get ECS service status
    CLUSTER="agent-builder-${ENVIRONMENT}-cluster"

    echo ""
    echo "=== Deployment Status ==="
    echo "Environment: $ENVIRONMENT"
    echo "Application URL: http://$ALB_DNS"
    echo ""

    # Show ECS services
    aws ecs describe-services \
        --cluster "$CLUSTER" \
        --services "agent-builder-${ENVIRONMENT}-backend" "agent-builder-${ENVIRONMENT}-frontend" \
        --query 'services[].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' \
        --output table 2>/dev/null || echo "Services not found"
}

show_logs() {
    log_info "Showing recent logs for $ENVIRONMENT..."

    LOG_GROUP="/ecs/agent-builder-${ENVIRONMENT}/backend"

    aws logs tail "$LOG_GROUP" \
        --since 1h \
        --format short \
        --region "$AWS_REGION" 2>/dev/null || log_error "Log group not found"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

show_help() {
    echo "Usage: $0 [environment] [command]"
    echo ""
    echo "Environments:"
    echo "  staging       Staging environment (default)"
    echo "  production    Production environment"
    echo ""
    echo "Commands:"
    echo "  init          Initialize Terraform"
    echo "  plan          Create Terraform plan"
    echo "  apply         Apply Terraform changes"
    echo "  destroy       Destroy all resources"
    echo "  output        Show Terraform outputs"
    echo "  build         Build Docker images"
    echo "  push          Push Docker images to ECR"
    echo "  migrate       Run database migrations"
    echo "  deploy-ecs    Deploy to ECS (force new deployment)"
    echo "  full-deploy   Full deployment (build, push, migrate, deploy)"
    echo "  status        Show deployment status"
    echo "  logs          Show recent application logs"
    echo ""
    echo "Examples:"
    echo "  $0 staging plan"
    echo "  $0 production full-deploy"
    echo "  $0 staging status"
}

# Parse command
case "$COMMAND" in
    init)
        check_prerequisites
        terraform_init
        ;;
    plan)
        check_prerequisites
        terraform_init
        terraform_plan
        ;;
    apply)
        check_prerequisites
        terraform_init
        terraform_apply
        ;;
    destroy)
        check_prerequisites
        terraform_init
        terraform_destroy
        ;;
    output)
        terraform_output
        ;;
    build)
        check_prerequisites
        build_docker
        ;;
    push)
        check_prerequisites
        push_docker
        ;;
    migrate)
        check_prerequisites
        run_migrations
        ;;
    deploy-ecs)
        check_prerequisites
        deploy_ecs
        ;;
    full-deploy)
        full_deploy
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
