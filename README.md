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

### 1. Configure Infrastructure Variables

Create your Terraform variables file from the template:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# OR for development environment
cp dev.tfvars.example dev.tfvars
```

Edit the file and fill in your actual values. **Never commit these files to git** - they contain sensitive credentials.

### 2. Deploy Infrastructure

```bash
cd infra
terraform init
terraform apply -var-file=dev.tfvars
# OR
terraform apply  # uses terraform.tfvars by default
```

After deployment, note the Terraform outputs (Cognito IDs, API Base URL, S3 bucket name).

### 3. Configure Frontend Environment

Create your frontend environment file from the template:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the values from your Terraform outputs. **Never commit this file to git** - it contains deployment-specific configuration.

Example:
```
VITE_REGION={VITE_REGION}
VITE_USER_POOL_ID={VITE_USER_POOL_ID}
VITE_USER_POOL_CLIENT_ID={VITE_USER_POOL_CLIENT_ID}
VITE_IDENTITY_POOL_ID={VITE_IDENTITY_POOL_ID}
VITE_API_BASE={VITE_API_BASE}
VITE_AVATARS_BUCKET={VITE_AVATARS_BUCKET}
```

### 4. Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 5. Build & Deploy

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

### Running Checks Locally

Before pushing your changes, you can run the same checks that run in CI/CD:

```bash
# Run all checks (frontend + infrastructure)
./run-checks.sh

# Run only frontend checks
./run-checks.sh --frontend-only

# Run only infrastructure checks
./run-checks.sh --infra-only

# Show help
./run-checks.sh --help
```

The script validates:
- **Frontend**: TypeScript types, ESLint, Prettier formatting, tests, build
- **Infrastructure**: Terraform formatting/validation, Python Black formatting, Flake8 linting, MyPy types, pytest

### Local Development

```bash
# Start local frontend dev server
cd frontend && npm run dev

# For backend changes, redeploy Lambda:
cd infra && terraform apply -var-file=dev.tfvars

# Test API endpoints with curl:
curl -H "Authorization: Bearer $ID_TOKEN" \
  https://api.example.com/dev/user
```

### Monorepo Commands

From the root directory, you can run:

```bash
# Install frontend dependencies
npm run install:frontend

# Start frontend dev server
npm run dev

# Run frontend tests
npm run test:frontend

# Run infrastructure tests
npm run test:infra

# Run all tests
npm run test:all

# Run all checks (alias for run-checks.sh)
npm run checks:all
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
