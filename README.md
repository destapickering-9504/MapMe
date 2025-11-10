# MapMe

A full-stack web application demonstrating AWS integration with a modern React frontend and serverless backend. The app provides user authentication, profile management with avatar uploads, and search history tracking.

## Architecture Overview

MapMe is built with:
- **Frontend**: React 18 + Vite + React Router for a fast, responsive SPA
- **Authentication**: AWS Cognito (User Pool + Identity Pool) with social login support
- **Backend**: AWS Lambda functions (Python) via API Gateway
- **Database**: DynamoDB for users and search history
- **Storage**: S3 for avatar uploads with CORS configuration
- **Hosting**: AWS Amplify for automated frontend deployment

### Prerequisites
- Terraform >= 1.7.0
- Node.js >= 16
- AWS credentials configured
- Social provider credentials (Google, Facebook, Apple) for federated login

````markdown
# MapMe

A full-stack web application demonstrating AWS integration with a modern React frontend and serverless backend. The app provides user authentication, profile management with avatar uploads, and search history tracking.

## Architecture Overview

MapMe is built with:
- **Frontend**: React 18 + Vite + React Router for a fast, responsive SPA
- **Authentication**: AWS Cognito (User Pool + Identity Pool) with social login support
- **Backend**: AWS Lambda functions (Python) via API Gateway
- **Database**: DynamoDB for users and search history
- **Storage**: S3 for avatar uploads with CORS configuration
- **Hosting**: AWS Amplify for automated frontend deployment

## Project Structure

```
MapMe/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── App.jsx    # Main app layout with routing
│   │   ├── aws-config.js  # AWS configuration from env vars
│   │   ├── pages/     # Page components (SignIn, SignUp, Onboarding, Home, UpdateProfile)
│   │   └── components/    # Reusable components (NavMenu, Sidebar, AvatarUpload)
│   ├── package.json
│   └── vite.config.js
│
└── infra/             # Terraform infrastructure as code
    ├── lambda_src/    # Lambda function handlers (Python)
    │   ├── user_handler/      # /user endpoint for profile management
    │   └── searches_handler/  # /searches endpoint for search history
    ├── *.tf files     # Resource definitions (Cognito, API GW, Lambda, DynamoDB, S3, Amplify)
    └── variables.tf   # Input variables for deployment
```

## Quick Start

### Prerequisites
- Terraform >= 1.7.0
- Node.js >= 16
- AWS credentials configured
- Social provider credentials (Google, Facebook, Apple) for federated login

### 1. Deploy Infrastructure

```bash
cd infra
terraform init
terraform apply \
  -var="amplify_repo=https://github.com/<your-username>/mapme-frontend" \
  -var="amplify_access_token=ghp_your_github_token" \
  -var='app_callback_urls=["https://yourbranch.amplifyapp.com/onboarding"]' \
  -var='app_logout_urls=["https://yourbranch.amplifyapp.com/signin"]' \
  -var="google_client_id=your_google_client_id" \
  -var="google_client_secret=your_google_client_secret" \
  -var="facebook_app_id=your_facebook_app_id" \
  -var="facebook_app_secret=your_facebook_app_secret" \
  -var="apple_team_id=your_apple_team_id" \
  -var="apple_services_id=your_apple_services_id" \
  -var="apple_key_id=your_apple_key_id" \
  -var="apple_private_key_p8=$(cat AuthKey_XXXXXX.p8)"
```

After deployment, note the Terraform outputs (Cognito IDs, API Base URL, S3 bucket name).

### 2. Configure Frontend Environment

Create `frontend/.env.local` with values from Terraform outputs:

```
VITE_REGION=us-west-1
VITE_USER_POOL_ID=us-west-1_XXXXXX
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_IDENTITY_POOL_ID=us-west-1:12345678-1234-1234-1234-123456789012
VITE_API_BASE=https://abc123xyz.execute-api.us-west-1.amazonaws.com/dev
VITE_AVATARS_BUCKET=mapme-avatars-abc123xyz
```

### 3. Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 4. Build & Deploy

```bash
npm run build
# Push to your GitHub repo; Amplify will automatically build and deploy
```

## Features

### Authentication
- **Sign In / Sign Up**: Cognito Hosted UI with email/password
- **Social Login**: Google, Facebook, and Apple OAuth integration
- **Secure Session**: JWT tokens managed by Cognito
- **Sign Out**: Clears session and redirects to sign-in page

### User Onboarding
- Avatar upload directly to S3 using temporary AWS credentials
- Profile information stored in DynamoDB
- Skip option for quick onboarding

### Home Page
- Displays user's search history from DynamoDB
- Lists previous queries in reverse chronological order
- RESTful API integration via API Gateway + Lambda

### Profile Management
- Update profile information
- View current avatar
- Session-aware operations using Cognito claims

## Key AWS Services

### AWS Cognito
- User Pool for authentication and profile storage
- Identity Pool for temporary S3 credentials
- Hosted UI for seamless social login experience

### AWS Lambda
- **User Handler**: `/user` endpoint returns user profile (email, name, user ID)
- **Searches Handler**: `/searches` endpoint (GET retrieves history, POST adds new search)
- Python runtime with automatic environment variables

### AWS DynamoDB
- `users` table: User profile data
- `searches` table: Search history (userId as partition key, createdAt as sort key)

### AWS S3
- Stores user avatars with per-user folder structure: `avatars/{userId}/{filename}`
- CORS configured for frontend cross-origin requests

### AWS API Gateway
- REST API with authorization via Cognito
- Automatic request/response formatting
- Staging deployments (dev, prod, etc.)

## Code Review Summary

### Frontend Architecture
- **Modular Components**: Reusable AvatarUpload, NavMenu, Sidebar components
- **Page-Based Routing**: Separate pages for different user flows (SignIn, SignUp, Onboarding, Home, UpdateProfile)
- **AWS Integration**: Direct S3 uploads using temporary credentials from Cognito Identity Pool
- **Environment Configuration**: Centralized AWS config in `aws-config.js`

### Backend Lambda Functions
- **Authorization**: Extract user claims from API Gateway authorizer
- **User Handler**: Returns authenticated user info (simple but extensible)
- **Searches Handler**: RESTful CRUD operations for search history
- **Error Handling**: Proper HTTP status codes (200, 201, 405)

### Infrastructure as Code
- **Modular Terraform**: Separate files for each AWS service (cognito.tf, lambda.tf, dynamodb.tf, etc.)
- **Resource Tagging**: Consistent naming with random suffix to avoid conflicts
- **Output Values**: Exposes critical IDs for frontend configuration
- **Variable Management**: Sensitive variables marked appropriately

## Security Considerations

1. **CORS S3 Bucket**: Currently permissive; tighten `allowed_origins` after testing
2. **API Gateway Authorization**: All endpoints require valid Cognito JWT
3. **IAM Roles**: Lambda has minimal permissions for DynamoDB and S3
4. **Environment Variables**: Sensitive data (credentials) passed via Terraform variables
5. **User Isolation**: DynamoDB queries scoped to authenticated user ID

## Development Workflow

```bash
# Start local frontend dev server
npm run dev

# For backend changes, redeploy Lambda:
terraform apply -var-file=prod.tfvars

# Test API endpoints with curl:
curl -H "Authorization: Bearer $ID_TOKEN" \
  https://api.example.com/dev/user
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cognito login redirect fails | Check callback URLs in variables; ensure they match frontend domain |
| S3 upload 403 error | Verify Identity Pool IAM role has S3:PutObject permission |
| API 401 Unauthorized | Ensure valid Cognito JWT is sent in Authorization header |
| Lambda timeout | Check environment variables and DynamoDB table exists |
| Amplify build fails | Verify `npm install && npm run build` works locally first |

## Next Steps

- Add search functionality to map interface
- Implement WebSocket for real-time collaboration
- Add rate limiting to API endpoints
- Set up CloudWatch alarms for monitoring
- Implement CI/CD pipeline for infrastructure testing
- Add unit and integration tests

## Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [React Router Documentation](https://reactrouter.com/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
````