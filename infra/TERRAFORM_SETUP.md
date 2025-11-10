# Terraform Setup Guide

## What I Fixed

I corrected the following Terraform syntax errors:
- ✅ `amplify.tf` - Removed problematic YAML heredoc (Amplify is disabled anyway)
- ✅ `variables.tf` - Converted single-line variable declarations to proper multi-line format
- ✅ `dynamodb.tf` - Fixed attribute blocks (semicolons → newlines)
- ✅ `identity-pool.tf` - Escaped Cognito Identity variables properly (`$$`)
- ✅ `backend.config` - Added proper configuration values

## Next Steps

### Option 1: Skip Backend for Now (Quickest)

If you just want to get the infrastructure deployed without remote state:

```bash
cd infra
terraform init -backend=false
terraform apply
```

This will use local state file. Good for testing, but not recommended for production.

### Option 2: Set Up Remote State (Recommended)

1. **First, create the state bucket and DynamoDB table:**

   Edit `backend.tf` and uncomment lines 10-69 (the resources in `/* */`)

2. **Initialize without backend:**
   ```bash
   cd infra
   terraform init -backend=false
   terraform apply
   ```

3. **Note the outputs:**
   - `terraform_state_bucket` = your S3 bucket name
   - `terraform_lock_table` = your DynamoDB table name

4. **Update `backend.config` with actual names from step 3**

5. **Re-comment the state resources in `backend.tf`** (lines 10-69)

6. **Migrate to remote backend:**
   ```bash
   terraform init -backend-config=backend.config -migrate-state
   ```
   Answer "yes" when prompted.

## Required Variables

You'll need to provide these variables when running `terraform apply`:

```bash
terraform apply \
  -var="amplify_repo=https://github.com/youruser/repo" \
  -var="amplify_access_token=dummy" \
  -var='app_callback_urls=["http://localhost:3000"]' \
  -var='app_logout_urls=["http://localhost:3000"]' \
  -var="google_client_id=dummy" \
  -var="google_client_secret=dummy" \
  -var="facebook_app_id=dummy" \
  -var="facebook_app_secret=dummy" \
  -var="apple_team_id=dummy" \
  -var="apple_services_id=dummy" \
  -var="apple_key_id=dummy" \
  -var="apple_private_key_p8=dummy"
```

Or create a `terraform.tfvars` file:
```hcl
aws_region             = "us-west-1"
amplify_repo           = "https://github.com/youruser/repo"
amplify_access_token   = "dummy"
app_callback_urls      = ["http://localhost:3000"]
app_logout_urls        = ["http://localhost:3000"]
google_client_id       = "dummy"
google_client_secret   = "dummy"
facebook_app_id        = "dummy"
facebook_app_secret    = "dummy"
apple_team_id          = "dummy"
apple_services_id      = "dummy"
apple_key_id           = "dummy"
apple_private_key_p8   = "dummy"
```

Then just run: `terraform apply`

## What Gets Created

After successful deployment, Terraform will create:
- S3 bucket for frontend static hosting
- CloudFront distribution for CDN
- Cognito User Pool and Identity Pool
- API Gateway with Lambda functions
- DynamoDB tables (users, searches)
- S3 bucket for avatars
- All necessary IAM roles and policies

## Important Outputs

After `terraform apply`, note these outputs for your frontend configuration:
- `cloudfront_domain_name` - Your frontend URL
- `frontend_bucket` - S3 bucket name for deployment
- `cloudfront_distribution_id` - For cache invalidation
- `cognito_user_pool_id` - For frontend auth config
- `cognito_user_pool_client_id` - For frontend auth config
- `cognito_identity_pool_id` - For frontend auth config
- `api_base_url` - Your API endpoint
- `avatars_bucket` - S3 bucket for user avatars
