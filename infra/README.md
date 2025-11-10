````markdown
# MapMe Infrastructure (Terraform)

This directory contains infrastructure as code for deploying MapMe on AWS using Terraform. It provisions a complete serverless backend with authentication, APIs, databases, and file storage.

## Architecture

```
┌─────────────────┐
│  React App      │ (Amplify Hosting)
│  (Frontend)     │
└────────┬────────┘
         │ (HTTPS)
    ┌────▼──────────────────────┐
    │  AWS Cognito              │
    │  • User Pool              │
    │  • Identity Pool          │
    │  • Hosted UI              │
    │  • Social Providers       │
    └────┬──────────────────────┘
         │ (JWT Token)
    ┌────▼──────────────────────┐
    │  API Gateway (REST)       │
    │  + Cognito Authorizer     │
    ├──────────────────────────┬┤
    │ /user (Lambda)           ││
    │ /searches (Lambda)       ││
    └──────────────────────────┴┘
         │              │
    ┌────▼────┐    ┌───▼──────────┐
    │ DynamoDB │    │ Lambda       │
    │ Tables   │    │ Python Env   │
    │ • users  │    │ • Handlers   │
    │ • searches│   │ • Libs       │
    └──────────┘    └──────────────┘
         │
    ┌────▼──────────┐
    │  S3 Bucket    │
    │  (Avatars)    │
    │  • CORS Setup │
    └───────────────┘
```

## Resources Created

### Authentication (cognito.tf, identity-pool.tf)
- **User Pool**: Stores user credentials and profiles
- **User Pool Client**: OAuth client for frontend
- **Hosted UI**: Cognito-managed login interface
- **Social Providers**: Google, Facebook, Apple integrations
- **Identity Pool**: Provides temporary AWS credentials for S3 access

### API Gateway (api-gw.tf)
- REST API with two endpoints:
  - `GET /user` - User profile handler
  - `GET/POST /searches` - Search history handler
- Cognito JWT authorizer for all endpoints
- Request/response models for validation
- CloudWatch logging

### Lambda Functions (lambda.tf)
Two Python handler functions:
1. **user_handler**: Returns authenticated user's profile
2. **searches_handler**: CRUD operations for search history

Environment variables automatically injected:
- `SEARCHES_TABLE` - DynamoDB table name
- `AWS_REGION` - Deployment region

### DynamoDB (dynamodb.tf)
Two tables:
- **users**: Stores user profile data
  - Partition Key: `userId` (String)
  - Attributes: email, name, avatar_url, etc.

- **searches**: Stores user search history
  - Partition Key: `userId` (String)
  - Sort Key: `createdAt` (String, Unix timestamp)
  - Query: Most recent searches first (ScanIndexForward=False)

### S3 (s3-avatars.tf)
- **Bucket**: `mapme-avatars-{random-suffix}`
- **CORS Policy**: Allows frontend to upload images
- **Folder Structure**: `avatars/{userId}/{filename}`
- **Access Control**: Identity Pool role provides temporary credentials

### Amplify (amplify.tf)
- Automatic deployments from GitHub/Bitbucket/CodeCommit
- Environment variables linked to Terraform outputs
- Branch deployments
- Build cache optimization

### IAM (iam.tf)
- **Lambda Execution Role**: DynamoDB read/write, CloudWatch logs
- **Amplify Role**: Repository access, logging
- **Identity Pool Roles**: S3 uploads with user-level access control

## Deployment

### Prerequisites
```bash
# Install Terraform
brew install terraform

# Ensure AWS credentials are configured
aws configure

# Collect OAuth credentials:
# - Google: https://console.cloud.google.com/
# - Facebook: https://developers.facebook.com/
# - Apple: https://developer.apple.com/
```

### Initialize Terraform

```bash
cd infra
terraform init
```

### Plan (Review Changes)

```bash
terraform plan \
  -var="amplify_repo=https://github.com/your-username/mapme-frontend" \
  -var="amplify_access_token=ghp_your_github_token" \
  -var='app_callback_urls=["https://yourbranch.amplifyapp.com/onboarding"]' \
  -var='app_logout_urls=["https://yourbranch.amplifyapp.com/"]' \
  -var="google_client_id=YOUR_GOOGLE_CLIENT_ID" \
  -var="google_client_secret=YOUR_GOOGLE_CLIENT_SECRET" \
  -var="facebook_app_id=YOUR_FACEBOOK_APP_ID" \
  -var="facebook_app_secret=YOUR_FACEBOOK_APP_SECRET" \
  -var="apple_team_id=YOUR_APPLE_TEAM_ID" \
  -var="apple_services_id=YOUR_APPLE_SERVICES_ID" \
  -var="apple_key_id=YOUR_APPLE_KEY_ID" \
  -var="apple_private_key_p8=$(cat AuthKey_XXXXXX.p8)"
```

### Apply (Deploy)

```bash
terraform apply -auto-approve  # Add -auto-approve to skip confirmation
```

### After Deployment

Capture Terraform outputs:

```bash
terraform output
```

Outputs include:
- `user_pool_id`
- `user_pool_client_id`
- `identity_pool_id`
- `api_base_url`
- `avatars_bucket_name`
- `amplify_default_domain`

Copy these to `frontend/.env.local`.

## Configuration Variables

All sensitive values are passed as Terraform variables (see `variables.tf`):

| Variable | Description | Example |
|----------|-------------|---------|
| `amplify_repo` | Frontend repo URL | `https://github.com/you/mapme-frontend` |
| `amplify_access_token` | GitHub token for repo access | `ghp_xxxx...` |
| `app_callback_urls` | Allowed Cognito redirects after signin | `["https://yourdomain.amplifyapp.com/onboarding"]` |
| `app_logout_urls` | Allowed Cognito redirects after logout | `["https://yourdomain.amplifyapp.com/signin"]` |
| `google_client_id` | OAuth 2.0 ID | From Google Cloud Console |
| `google_client_secret` | OAuth 2.0 secret | From Google Cloud Console |
| `facebook_app_id` | Facebook App ID | From Facebook Developer Portal |
| `facebook_app_secret` | Facebook App Secret | From Facebook Developer Portal |
| `apple_team_id` | Apple Team ID | From Apple Developer Account |
| `apple_services_id` | Apple Services ID | From Apple Developer Account |
| `apple_key_id` | Apple Key ID | From Apple Developer Account |
| `apple_private_key_p8` | Apple private key | From Apple Developer Account (AuthKey_XXXXX.p8) |

## File Structure

```
infra/
├── main.tf                 # Provider & random suffix
├── variables.tf            # Input variables
├── outputs.tf              # Output values for frontend
├── locals.tf               # Local variables & naming
├── cognito.tf              # User Pool, Client, Hosted UI
├── identity-pool.tf        # Cognito Identity Pool
├── api-gw.tf               # API Gateway & endpoints
├── lambda.tf               # Lambda functions & policies
├── dynamodb.tf             # DynamoDB tables
├── s3-avatars.tf           # S3 bucket & CORS
├── amplify.tf              # Amplify hosting
├── iam.tf                  # IAM roles & policies
├── lambda_src/
│   ├── user_handler/
│   │   └── index.py        # User profile handler
│   └── searches_handler/
│       └── index.py        # Search history handler
└── README.md               # This file
```

## Lambda Function Examples

### User Handler (`/user`)

**Request:**
```
GET /user
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "userId": "us-west-1_xxx:12345678-...",
  "email": "user@example.com",
  "name": "John Doe",
  "onboardingComplete": false
}
```

### Searches Handler (`/searches`)

**GET - Retrieve Search History**
```
GET /searches
Authorization: Bearer {JWT_TOKEN}
```

Response:
```json
[
  {
    "userId": "us-west-1_xxx:...",
    "createdAt": "1636401234",
    "query": "pizza near me"
  },
  {
    "userId": "us-west-1_xxx:...",
    "createdAt": "1636401100",
    "query": "coffee shops"
  }
]
```

**POST - Add Search**
```
POST /searches
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "query": "best restaurants"
}
```

Response:
```json
{
  "ok": true
}
```

## Maintenance & Scaling

### Monitoring
- CloudWatch Logs: Check Lambda execution and errors
- DynamoDB Metrics: Monitor read/write capacity
- API Gateway: View request metrics and errors

### Scaling DynamoDB

For higher traffic, consider on-demand billing:

```hcl
# In dynamodb.tf
billing_mode = "PAY_PER_REQUEST"  # Instead of PROVISIONED
```

### Updating Lambda Code

Edit `lambda_src/{handler}/index.py`, then:

```bash
terraform apply
```

Terraform will automatically zip and redeploy.

### Managing Credentials

Store sensitive values in a `.tfvars` file (add to `.gitignore`):

```bash
# Create prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Cognito login fails | Invalid callback URL | Verify in Cognito console matches frontend URL |
| S3 upload 403 | CORS or permissions | Check s3-avatars.tf CORS config and IAM role |
| Lambda timeout | Missing env vars | Check lambda.tf environment variables |
| DynamoDB throttling | Low capacity | Increase provisioned capacity or switch to PAY_PER_REQUEST |
| Amplify build fails | Missing env vars | Check amplify.tf environment_variables |

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete databases, S3 objects, and user data!

## Further Reading

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [AWS Cognito Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [Lambda Python Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
````