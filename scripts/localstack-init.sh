#!/bin/bash

# =============================================================================
# LocalStack Initialization Script
# =============================================================================
# Creates S3 bucket and other AWS resources for local development
# =============================================================================

echo "Initializing LocalStack..."

# Wait for LocalStack to be ready
sleep 5

# Create S3 bucket for artifacts
awslocal s3 mb s3://local-bucket

# Configure bucket CORS
awslocal s3api put-bucket-cors --bucket local-bucket --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

# Enable versioning
awslocal s3api put-bucket-versioning --bucket local-bucket --versioning-configuration Status=Enabled

# Create bucket lifecycle policy
awslocal s3api put-bucket-lifecycle-configuration --bucket local-bucket --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "expire-old-versions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 7
      }
    }
  ]
}'

echo "LocalStack initialization complete!"
echo "S3 bucket 'local-bucket' created and configured"

# List created resources
echo ""
echo "=== Created Resources ==="
awslocal s3 ls
