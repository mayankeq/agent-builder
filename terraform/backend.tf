# =============================================================================
# Terraform Backend Configuration
# =============================================================================
# This file defines the remote state backend for Terraform.
# Uncomment and configure the S3 backend for production use.
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Backend Configuration (Recommended for Production)
# -----------------------------------------------------------------------------
# To use S3 as a remote backend:
# 1. Create an S3 bucket for Terraform state
# 2. Create a DynamoDB table for state locking
# 3. Update the values below
# 4. Uncomment the backend block
# 5. Run `terraform init -reconfigure`
# -----------------------------------------------------------------------------

# terraform {
#   backend "s3" {
#     bucket         = "agent-builder-terraform-state"
#     key            = "terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "agent-builder-terraform-locks"
#
#     # Optional: Use a specific AWS profile
#     # profile = "production"
#
#     # Optional: Assume a role for cross-account access
#     # role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformRole"
#   }
# }

# -----------------------------------------------------------------------------
# Bootstrap Resources for S3 Backend
# -----------------------------------------------------------------------------
# Run this separately to create the S3 bucket and DynamoDB table:
#
# resource "aws_s3_bucket" "terraform_state" {
#   bucket = "agent-builder-terraform-state"
#
#   lifecycle {
#     prevent_destroy = true
#   }
# }
#
# resource "aws_s3_bucket_versioning" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#
#   versioning_configuration {
#     status = "Enabled"
#   }
# }
#
# resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }
#
# resource "aws_s3_bucket_public_access_block" "terraform_state" {
#   bucket = aws_s3_bucket.terraform_state.id
#
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }
#
# resource "aws_dynamodb_table" "terraform_locks" {
#   name         = "agent-builder-terraform-locks"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"
#
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
#
#   lifecycle {
#     prevent_destroy = true
#   }
# }
