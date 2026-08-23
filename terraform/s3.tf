resource "aws_s3_bucket" "assets" {
  bucket = local.bucket_name

  tags = {
    Environment = local.environment
    Project     = "ohmywedding"
  }
}

# Block all public ACL access — files are served via presigned URLs or direct S3 URLs
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Bucket policy:
#   - Public GET on all objects (wedding website assets, hero images, gallery)
#   - Anonymous access explicitly DENIED for guest-photos/ prefix
#     Presigned URLs still work — they carry IAM credentials and are not "Anonymous"
resource "aws_s3_bucket_policy" "assets_public_read" {
  bucket = aws_s3_bucket.assets.id

  depends_on = [aws_s3_bucket_public_access_block.assets]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets.arn}/*"
      },
      {
        Sid       = "DenyAnonymousReadGuestPhotos"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.assets.arn}/guest-photos/*"
        Condition = {
          StringEquals = {
            "aws:PrincipalType" = "Anonymous"
          }
        }
      }
    ]
  })
}

# CORS: allow browser direct PUT uploads (presigned URLs).
# Dev allows local origins; prod allows only production domains.
resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = local.cors_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Lifecycle for guest-photos/:
#   - Move to STANDARD_IA after 1 year (cost saving while accessible)
#   - Permanently delete after 60 months (couples have 5 years to download)
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "guest-photos-lifecycle"
    status = "Enabled"

    filter {
      prefix = "guest-photos/"
    }

    transition {
      days          = 365
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 1825 # 60 months ≈ 5 years
    }
  }
}
