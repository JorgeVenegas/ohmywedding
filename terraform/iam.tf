resource "aws_iam_user" "app" {
  name = local.iam_name

  tags = {
    Environment = local.environment
    Project     = "ohmywedding"
  }
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

resource "aws_iam_user_policy" "app_s3" {
  name = "omw-s3-policy"
  user = aws_iam_user.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
        ]
        Resource = "${aws_s3_bucket.assets.arn}/*"
      },
      {
        # Needed by the migration script to list bucket contents
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.assets.arn
      }
    ]
  })
}
