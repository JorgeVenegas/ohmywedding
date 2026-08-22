# Lambda: generate-guest-photo-preview

Generates a 1200 px-wide WebP preview for every guest photo original uploaded to S3.
Triggered automatically by an S3 ObjectCreated event, and re-invoked from the Next.js
API (once) when a preview is missing on dashboard load.

## Deploy

```bash
cd lambda/generate-preview

# Install Sharp for Amazon Linux 2 (Lambda runtime)
npm install --platform=linux --arch=x64 sharp

# Bundle
zip -r function.zip index.mjs node_modules package.json

# Create or update the function (first time)
aws lambda create-function \
  --function-name generate-guest-photo-preview \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME> \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512

# Update code only (subsequent deploys)
aws lambda update-function-code \
  --function-name generate-guest-photo-preview \
  --zip-file fileb://function.zip
```

## Environment variables (set in Lambda console or via CLI)

| Variable | Value |
|---|---|
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET` | your S3 bucket name |
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (keep secret) |

Note: `AWS_REGION` is already injected by the Lambda runtime — only set it if you need to override.

## IAM role permissions required

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::<BUCKET>/guest-photos/*"
}
```

## S3 event trigger

In the S3 console → your bucket → Properties → Event notifications → Create:

| Field | Value |
|---|---|
| Event types | `s3:ObjectCreated:*` |
| Prefix filter | `guest-photos/` |
| Destination | Lambda → `generate-guest-photo-preview` |

The prefix filter ensures Lambda only fires on guest photo uploads (not wedding images, etc.).
The Lambda itself skips any key that looks like a preview (`/preview.webp`) to avoid loops.

## S3 lifecycle rule (60-month auto-delete)

Apply this to your bucket to automatically delete guest photos after 5 years:

```json
{
  "Rules": [
    {
      "ID": "guest-photos-60-month-ttl",
      "Status": "Enabled",
      "Filter": { "Prefix": "guest-photos/" },
      "Expiration": { "Days": 1825 }
    }
  ]
}
```

## Next.js env var

Add to `.env.local` and your hosting environment:

```
GENERATE_PREVIEW_LAMBDA_NAME=generate-guest-photo-preview
```
