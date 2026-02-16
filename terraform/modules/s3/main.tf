# =============================================================================
# S3 Module - Main Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "main" {
  bucket = "${var.name_prefix}-artifacts-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-artifacts"
  })
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# Bucket Versioning
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# -----------------------------------------------------------------------------
# Server-Side Encryption
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# -----------------------------------------------------------------------------
# Public Access Block
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Lifecycle Rules
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    # Delete non-current versions after specified days
    noncurrent_version_expiration {
      noncurrent_days = var.lifecycle_expiration_days
    }

    # Abort incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {
      prefix = "archives/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "expire-temp-files"
    status = "Enabled"

    filter {
      prefix = "tmp/"
    }

    expiration {
      days = var.lifecycle_expiration_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# -----------------------------------------------------------------------------
# CORS Configuration
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag", "x-amz-meta-custom-header"]
    max_age_seconds = 3600
  }
}

# -----------------------------------------------------------------------------
# Bucket Policy
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSSLOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyInsecureTLS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          NumericLessThan = {
            "s3:TlsVersion" = "1.2"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

# -----------------------------------------------------------------------------
# Bucket Logging (Optional - creates a separate logging bucket)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = "${var.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-logs"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main" {
  count         = var.enable_logging ? 1 : 0
  bucket        = aws_s3_bucket.main.id
  target_bucket = aws_s3_bucket.logs[0].id
  target_prefix = "access-logs/"
}
