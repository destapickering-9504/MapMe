# Quick Start Guide - Fix Backend Error

## The Problem
You're getting a DynamoDB error because Terraform is trying to use a remote backend (S3 + DynamoDB) that doesn't exist yet.

## The Solution - Deploy in Two Stages

### Stage 1: Deploy Without Remote Backend

1. **Initialize Terraform WITHOUT backend:**
   ```bash
   cd infra
   terraform init -backend=false
   ```

2. **Deploy the infrastructure:**
   ```bash
   terraform apply
   ```
   
   Review the plan and type `yes` to confirm.

3. **Save the outputs** - You'll need these values:
   - `cloudfront_domain_name` - Your frontend URL
   - `frontend_bucket` - For GitHub Actions deployment
   - `cloudfront_distribution_id` - For cache invalidation
   - `cognito_user_pool_id` - For frontend config
   - `cognito_user_pool_client_id` - For frontend config
   - `cognito_identity_pool_id` - For frontend config
   - `api_base_url` - Your API endpoint

### Stage 2: (Optional) Set Up Remote Backend Later

If you want team collaboration with state locking:

1. **Edit `backend.tf` and uncomment lines 10-69**

2. **Apply to create state resources:**
   ```bash
   terraform apply
   ```

3. **Note the new outputs:**
   - `terraform_state_bucket`
   - `terraform_lock_table`

4. **Update `backend.config` with the real names**

5. **Re-comment the resources in `backend.tf`** (lines 10-69)

6. **Migrate to remote backend:**
   ```bash
   terraform init -backend-config=backend.config -migrate-state
   ```
   Type `yes` when prompted.

## Current Status

✅ Terraform syntax errors fixed
✅ `terraform.tfvars` created with dummy values
✅ Ready to deploy!

## Next: Run This Command

```bash
cd infra
terraform init -backend=false
terraform apply
```

This will create all your AWS resources (S3, CloudFront, Cognito, API Gateway, Lambda, DynamoDB) without the remote backend complication.

Once deployed successfully, we'll continue with the CI/CD pipelines!
