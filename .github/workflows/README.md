# GitHub Actions CI/CD Pipelines

## Overview

Two automated pipelines for deploying your MapMe application:

1. **Frontend Deploy** - Triggers on `frontend/**` changes
2. **Infrastructure Deploy** - Triggers on `infra/**` changes

## Pipeline Architecture

### Frontend Deploy Pipeline (`frontend-deploy.yml`)

**Triggers:**
- Push to `main` branch with changes in `frontend/**`
- Manual trigger via `workflow_dispatch`

**Jobs:**
1. **Test & Build**
   - Type checking (TypeScript)
   - Linting (ESLint)
   - Formatting check (Prettier)
   - Unit tests (Vitest)
   - Build production bundle

2. **Deploy to S3**
   - Upload to S3 bucket
   - Set optimal caching headers
   - Invalidate CloudFront cache

3. **Notify**
   - Success/failure notifications

### Infrastructure Deploy Pipeline (`infrastructure-deploy.yml`)

**Triggers:**
- Push to `main` branch with changes in `infra/**`
- Manual trigger via `workflow_dispatch`

**Jobs:**
1. **Validate & Plan**
   - Terraform format check
   - Terraform init
   - Terraform validate
   - Terraform plan

2. **Test Backend**
   - Black (formatter check)
   - Flake8 (linter)
   - mypy (type checker)
   - pytest (unit tests with coverage)

3. **Security Scan**
   - Safety (Python dependency vulnerabilities)
   - Checkov (Terraform security scan)

4. **Deploy**
   - Terraform apply
   - Output infrastructure details

5. **Notify**
   - Success/failure notifications

## Required GitHub Secrets

### AWS Credentials
```
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-west-1
```

### Frontend Configuration
```
FRONTEND_BUCKET=mapme-frontend-o3dhqr
CLOUDFRONT_DISTRIBUTION_ID=E2VSABYHHMYBF6
```

### Frontend Environment Variables
```
VITE_REGION=us-west-1
VITE_USER_POOL_ID=us-west-1_ZMKLDtI2q
VITE_USER_POOL_CLIENT_ID=4b3kkbsqub9kmr32sionpfj1de
VITE_IDENTITY_POOL_ID=us-west-1:0ffd1793-1426-4c81-969d-48ebaa3afc40
VITE_API_BASE=https://aurbp6oj1e.execute-api.us-west-1.amazonaws.com/dev
VITE_AVATARS_BUCKET=mapme-avatars-o3dhqr
```

### Infrastructure Configuration  
```
TF_STATE_BUCKET=mapme-terraform-state-o3dhqr
TF_STATE_DYNAMODB_TABLE=mapme-terraform-locks-o3dhqr
```

### Optional (for notifications)
```
EMAIL_NOTIFICATIONS_RECIPIENT=your-email@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret listed above

## Workflow Features

### Frontend Pipeline
✅ TypeScript type checking  
✅ ESLint linting  
✅ Prettier formatting check  
✅ Vitest unit tests  
✅ Optimized S3 deployment  
✅ CloudFront cache invalidation  
✅ Build artifacts (7 day retention)  

### Infrastructure Pipeline
✅ Terraform format/validate/plan  
✅ Python code quality (Black, Flake8, mypy)  
✅ pytest with coverage reporting  
✅ Security scanning (Safety + Checkov)  
✅ Automated Terraform apply  
✅ PR comments with Terraform plan  

## Manual Trigger

Both pipelines support manual execution:

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Choose branch and run

## Pipeline Outputs

### Frontend Deploy
- Deployment URL in job summary
- Build artifacts available for 7 days

### Infrastructure Deploy
- Terraform outputs in job summary
- Coverage reports uploaded to Codecov
- Security scan results

## Troubleshooting

### Frontend Pipeline Fails

**Type Check Errors:**
```bash
cd frontend
npm install
npm run type-check
```

**Test Failures:**
```bash
cd frontend
npm test
```

**Build Errors:**
- Check environment variables are set correctly
- Verify all secrets are configured

### Infrastructure Pipeline Fails

**Terraform Errors:**
```bash
cd infra
terraform init
terraform validate
terraform plan
```

**Python Test Failures:**
```bash
cd infra
pip install -r requirements-dev.txt
pytest
```

**Security Scan Issues:**
- Review Safety report for vulnerable dependencies
- Check Checkov findings for Terraform security

## Local Testing

### Frontend
```bash
cd frontend
npm install
npm run type-check
npm run lint
npm run format:check
npm test -- --run
npm run build
```

### Infrastructure
```bash
cd infra
pip install -r requirements-dev.txt
terraform fmt -check -recursive
terraform validate
black --check lambda_src/
flake8 lambda_src/
mypy lambda_src/
pytest --cov
```

## Deployment Flow

### Frontend Changes
```
Code change → Push to main → 
  ↓
Test & Build (5-10 min) →
  ↓
Deploy to S3 (1-2 min) →
  ↓
Invalidate CloudFront (2-5 min) →
  ↓
✅ Live at CloudFront URL
```

### Infrastructure Changes
```
Code change → Push to main →
  ↓
Validate & Test (5-10 min) →
  ↓
Security Scan (2-3 min) →
  ↓
Terraform Apply (10-15 min) →
  ↓
✅ Infrastructure updated
```

## Best Practices

1. **Always review Terraform plans** before merging PRs
2. **Run tests locally** before pushing
3. **Use feature branches** and PRs for changes
4. **Monitor pipeline runs** in GitHub Actions
5. **Keep secrets up to date** when rotating credentials
6. **Review security scan results** regularly

## Cost Optimization

- Build artifacts retained for 7 days (configurable)
- CloudFront cache maximized for static assets
- GitHub Actions minutes: ~15-20 min per deployment

## Next Steps

1. Add GitHub secrets as documented above
2. Make a small change to `frontend/` or `infra/`
3. Push to `main` branch
4. Watch pipeline run in Actions tab
5. Verify deployment success
