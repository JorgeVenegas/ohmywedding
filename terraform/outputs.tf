output "bucket_name" {
  description = "S3 bucket name — set as AWS_S3_BUCKET"
  value       = aws_s3_bucket.assets.id
}

output "bucket_region" {
  description = "S3 bucket region — set as AWS_REGION"
  value       = var.aws_region
}

output "access_key_id" {
  description = "IAM access key ID — set as AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.app.id
  sensitive   = true
}

output "secret_access_key" {
  description = "IAM secret access key — set as AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.app.secret
  sensitive   = true
}

output "bucket_base_url" {
  description = "Base public URL for assets — set as NEXT_PUBLIC_S3_BASE_URL"
  value       = "https://${aws_s3_bucket.assets.id}.s3.${var.aws_region}.amazonaws.com"
}
