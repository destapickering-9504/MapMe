# Deployment Guide - Modular CI/CD Architecture

This document explains the new modular deployment architecture that enables fast, targeted deployments.

## 🎯 Overview

The infrastructure is now split into three independent deployment workflows:

1. **Frontend Infrastructure** - CloudFront, Cognito, S3 buckets
2. **Backend Infrastructure** - API Gateway, DynamoDB, IAM, CloudWatch
3. **Lambda Functions** - Fast code-only deployments (~30 seconds)

## 📁 File Structure

```
infra/
├── frontend-*.tf          # Frontend infrastructure resources
├── backend-*.tf           # Backend infrastructure resources  
├── lambda-functions.tf    # Lambda function definitions (config only)
├── main.tf               # Shared configuration
├── variables.tf          # Variable definitions
├── locals.tf             # Local values
├── outputs.tf            # Output values
└── lambda_src/           # Lambda source code
    ├── user_handler/
    ├── searches_handler/
    └── post_confirmation_handler/
```

## 🚀 Deployment Workflows

### 1. Frontend Infrastructure Deploy
**Workflow:** `.github/workflows/frontend-infra-deploy.yml`

**Triggers on changes to:**
- `infra/frontend-*.tf`
- `infra/main.tf`, `variables.tf`, `locals.tf`, `outputs.tf`

**Deploys:**
- CloudFront Distribution
- Cognito User Pool & Identity Pool
- S3 Buckets (Frontend & Avatars)

**Deployment time:** ~2-3 minutes

### 2. Backend Infrastructure Deploy
**Workflow:** `.github/workflows/backend-infra-deploy.yml`

**Triggers on changes to:**
- `infra/backend-*.tf`
- `infra/main.tf`, `variables.tf`, `locals.tf`, `outputs.tf`

**Deploys:**
- API Gateway
- DynamoDB Tables
- IAM Roles & Policies
- CloudWatch Alarms

**Deployment time:** ~2-3 minutes

### 3. Lambda Functions Deploy ⚡
**Workflow:** `.github/workflows/lambda-deploy.yml`

**Triggers on changes to:**
- `infra/lambda_src/**/*.py`
- `infra/lambda_src/**/requirements.txt`

**Deploys:**
- Lambda function code only (via AWS CLI)
- No Terraform apply needed!

**Deployment time:** ~30 seconds 🎉

**Process:**
1. Runs Python tests (pytest, black, flake8, mypy)
2. Packages each Lambda function with dependencies
3. Uses `aws lambda update-function-code` for direct update
4. Waits for functions to be ready

## 🔧 How It Works

### Lambda Configuration vs Code

**Terraform Manages:**
- Function configuration (runtime, timeout, environment variables)
- IAM roles and permissions
- API Gateway integrations
- CloudWatch alarms

**CI/CD Manages:**
- Lambda source code
- Function packages (ZIP files)
- Code deployments

### Lifecycle Management

Lambda functions use `ignore_changes` lifecycle rules:

```hcl
lifecycle {
  ignore_changes = [
    filename,
    source_code_hash,
    last_modified
  ]
}
```

This tells Terraform to ignore code changes, allowing CI/CD to manage them independently.

## 📝 Making Changes

### Changing Lambda Code
1. Edit files in `infra/lambda_src/`
2. Commit and push to `main` or `qa` branch
3. `lambda-deploy.yml` automatically runs
4. **Result:** Code deployed in ~30 seconds ✅

### Changing Lambda Configuration
1. Edit `infra/lambda-functions.tf` (timeout, env vars, etc.)
2. Commit and push
3. `lambda-deploy.yml` runs (triggers on lambda-functions.tf changes)
4. Terraform apply updates configuration
5. **Result:** Config updated, code redeployed

### Changing Frontend Infrastructure
1. Edit files matching `infra/frontend-*.tf`
2. Commit and push
3. `frontend-infra-deploy.yml` automatically runs
4. **Result:** Only frontend resources updated (~2-3 min)

### Changing Backend Infrastructure
1. Edit files matching `infra/backend-*.tf`
2. Commit and push
3. `backend-infra-deploy.yml` automatically runs
4. **Result:** Only backend resources updated (~2-3 min)

## 🔄 Migration from Old System

### Before (Single Workflow)
- Any change triggered full `infrastructure-deploy.yml`
- Lambda code changes required full Terraform apply (~10 minutes)
- All resources checked on every deployment
- Blast radius: entire infrastructure

### After (Modular Workflows)
- Changes trigger only relevant workflow
- Lambda code changes deploy directly via AWS CLI (~30 seconds)
- Only changed resources are evaluated
- Blast radius: isolated to specific component

## 🎛️ Manual Deployments

### Deploy Lambda Functions Manually
```bash
cd infra

# Package and deploy user handler
cd lambda_src
mkdir -p /tmp/user_package
cp user_handler/*.py /tmp/user_package/
cp common/*.py /tmp/user_package/
cd /tmp/user_package && zip -r user.zip .

aws lambda update-function-code \
  --function-name mapme-dev-user \
  --zip-file fileb://user.zip \
  --region us-west-1
```

### Deploy Infrastructure Manually
```bash
cd infra

# Frontend only
terraform apply -target=aws_cloudfront_distribution.frontend \
                -target=aws_cognito_user_pool.this

# Backend only
terraform apply -target=aws_api_gateway_rest_api.rest_api \
                -target=aws_dynamodb_table.users
```

## 🐛 Troubleshooting

### Lambda deployment fails
- Check function exists: `aws lambda get-function --function-name mapme-dev-user`
- Verify AWS credentials have `lambda:UpdateFunctionCode` permission
- Check package size limits (50MB zipped, 250MB unzipped)

### Terraform plan shows unexpected changes
- Run `terraform plan -var-file=dev.tfvars` locally to verify
- Check if lifecycle `ignore_changes` is properly set
- Ensure state is in sync: `terraform refresh`

### Workflow doesn't trigger
- Verify file paths in workflow `paths:` section
- Check branch name matches (`main` or `qa`)
- Manually trigger with `workflow_dispatch`

## 📊 Deployment Comparison

| Scenario | Old System | New System | Improvement |
|----------|-----------|------------|-------------|
| Lambda code change | ~10 minutes | ~30 seconds | **20x faster** |
| Frontend change | ~10 minutes | ~3 minutes | **3x faster** |
| Backend change | ~10 minutes | ~3 minutes | **3x faster** |
| Full deployment | ~10 minutes | ~10 minutes | Same |

## 🔐 Security Notes

- All deployments use OIDC for AWS authentication (no long-lived credentials)
- Lambda packages are ephemeral (created and deployed in CI/CD)
- Terraform state stored in S3 with encryption and locking
- IAM roles follow principle of least privilege

## 📚 Additional Resources

- [GitHub Actions Workflows](.github/workflows/)
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
