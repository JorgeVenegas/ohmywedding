import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { GuestPhotoPreviewStack } from '../lib/guest-photo-preview-stack'

// Load .env.local if present (for local cdk synth/deploy)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') })
} catch { /* dotenv not installed — env vars must be set externally */ }

const app = new cdk.App()

const bucketName = process.env.AWS_S3_BUCKET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!bucketName) throw new Error('AWS_S3_BUCKET env var is required')
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var is required')

new GuestPhotoPreviewStack(app, 'OhMyWeddingGuestPhotoPreview', {
  bucketName,
  supabaseUrl,
  // SSM param path where you stored your Supabase service role key.
  // Create it once:
  //   aws ssm put-parameter \
  //     --name /ohmywedding/supabase-service-role-key \
  //     --type SecureString \
  //     --value "<YOUR_SUPABASE_SERVICE_ROLE_KEY>"
  supabaseKeyParam: '/ohmywedding/supabase-service-role-key',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION,
  },
  description: 'Lambda + S3 trigger + lifecycle rule for guest photo preview generation',
})
