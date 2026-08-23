# OhMyWedding — Terraform

All AWS infrastructure is managed here. **Never create, modify, or delete AWS resources manually** (Console, CLI, or any other tool). Manual changes cause drift between the real infrastructure and this codebase, are not tracked in version control, and will be silently overwritten on the next `terraform apply`.

> If you already made a manual change: update the `.tf` files to match first, import the resource if needed, then apply. Do not delete and recreate — data loss risk.

---

## Workspaces

| Workspace | AWS bucket | Purpose |
|---|---|---|
| `default` (dev) | `ohmywedding-assets-dev` | Local development + staging |
| `prod` | `ohmywedding-assets` | Production |

Switch workspaces with:
```bash
terraform workspace select default   # dev
terraform workspace select prod      # prod
```

---

## Prerequisites

1. AWS CLI configured with the `omw-terraform` user credentials:
   ```bash
   aws configure
   ```
2. Terraform installed (`brew install terraform`)
3. Run once to initialize:
   ```bash
   cd terraform
   terraform init
   ```

---

## Workflow — always plan before applying

```bash
# 1. Switch to the target workspace
terraform workspace select default   # or prod

# 2. Preview what will change (required before any apply)
terraform plan

# 3. Review the plan carefully, then apply
terraform apply
```

Never run `terraform apply` without reviewing the plan first.

---

## Deploying to dev

```bash
cd terraform
terraform workspace select default
terraform plan
terraform apply
```

## Deploying to prod

```bash
cd terraform
terraform workspace select prod
terraform plan
terraform apply
```

Prod requires the same AWS credentials — the `omw-terraform` IAM user has permissions for both buckets. Review the plan output extra carefully before applying to prod.

---

## What is managed here

| File | Resources |
|---|---|
| `main.tf` | Provider config, workspace locals, CORS origins |
| `s3.tf` | S3 bucket, public access block, bucket policy, CORS, lifecycle rules |
| `iam.tf` | IAM user (`omw-app-*`), access key, S3 policy |
| `variables.tf` | Input variables (region, etc.) |
| `outputs.tf` | Bucket name, region, IAM credentials — copy these to `.env.local` |

### Bucket policy rules (s3.tf)
- `PublicReadGetObject` — all objects are publicly readable (wedding website assets)
- `DenyAnonymousReadGuestPhotos` — `guest-photos/*` is blocked for anonymous requests; presigned URLs still work (they carry IAM credentials)

### Lifecycle (s3.tf)
- `guest-photos/` moves to STANDARD_IA after 365 days (cost saving)
- `guest-photos/` is permanently deleted after 1825 days / 60 months (couples have 5 years to download)

---

## Adding a new AWS resource

1. Write the resource in the appropriate `.tf` file (or create a new one)
2. Run `terraform plan` — verify only the intended resource is being created
3. Run `terraform apply`
4. Commit the `.tf` file change

## Importing an existing manually-created resource

If a resource was accidentally created manually and you want Terraform to manage it:

```bash
terraform import aws_s3_bucket.example my-bucket-name
```

Then add the matching resource block in the `.tf` files and run `terraform plan` to confirm there is no diff.

---

## Terraform state

State is currently stored locally (`terraform.tfstate`). This file is git-ignored. Do not commit it.

To share state across machines (recommended for prod):

1. Create a dedicated S3 bucket for state: `omw-terraform-state`
2. Uncomment the `backend "s3"` block in `main.tf`
3. Run `terraform init -migrate-state`

---

## Credentials in outputs

After `terraform apply`, retrieve the IAM credentials for the app:

```bash
terraform output -raw access_key_id
terraform output -raw secret_access_key
```

Copy these into `.env.local` as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
