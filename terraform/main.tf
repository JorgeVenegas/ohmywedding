terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to store state in S3 once you have a state bucket:
  # backend "s3" {
  #   bucket = "omw-terraform-state"
  #   key    = "main/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# Workspace-derived locals — workspace "prod" targets production, anything else is dev.
locals {
  is_prod     = terraform.workspace == "prod"
  environment = local.is_prod ? "production" : "development"
  bucket_name = local.is_prod ? "ohmywedding-assets" : "ohmywedding-assets-dev"
  iam_name    = "omw-app-${local.environment}"

  # CORS origins: dev allows local URLs + any ohmy.local subdomain;
  # prod allows only production domains.
  cors_origins = local.is_prod ? [
    "https://ohmy.wedding",
    "https://www.ohmy.wedding",
  ] : [
    "http://localhost:3000",
    "http://ohmy.local",
    "http://ohmy.local:3000",
    "http://*.ohmy.local",
    "http://*.ohmy.local:3000",
  ]
}
