# MapMe Frontend (React + Vite)

A modern, fast React single-page application built with Vite. The frontend integrates with AWS Cognito for authentication and AWS services for data persistence and file storage.

## Quick Start

### Prerequisites
- Node.js >= 16
- npm or yarn package manager
- AWS credentials and Terraform-generated environment variables

### Installation

```bash
# Install dependencies
npm install

# Create .env.local with AWS configuration (see Configuration section)
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Configuration

Create `.env.local` in the `frontend/` directory with values from your Terraform deployment:

```bash
# AWS Region
VITE_REGION=us-west-1

# Cognito User Pool
VITE_USER_POOL_ID=us-west-1_XXXXXXX

# Cognito User Pool Client
VITE_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j

# Cognito Identity Pool (for S3 access)
VITE_IDENTITY_POOL_ID=us-west-1:12345678-1234-1234-1234-123456789012

# API Gateway Base URL
VITE_API_BASE=https://abc123xyz.execute-api.us-west-1.amazonaws.com/dev

# S3 Avatars Bucket Name
VITE_AVATARS_BUCKET=mapme-avatars-abc123xyz
```

> **Tip**: Run `cd ../infra && terraform output` to get these values

## Project Structure

```
src/
├── App.jsx                    # Root component with layout & routing
├── aws-config.js              # Centralized AWS configuration
├── main.jsx                   # Entry point & React root
├── pages/
│   ├── SignIn.jsx             # Sign in page with Cognito Hosted UI
│   ├── SignUp.jsx             # Sign up page
│   ├── Onboarding.jsx         # User onboarding with avatar upload
│   ├── Home.jsx               # Main dashboard with search history
│   └── UpdateProfile.jsx      # Profile editing page
└── components/
    ├── AvatarUpload.jsx       # Avatar upload to S3
    ├── NavMenu.jsx            # Top navigation bar
    └── Sidebar.jsx            # Left sidebar navigation
```

## Architecture

### Authentication Flow

1. **SignIn Page**: Redirects to Cognito Hosted UI
2. **Cognito Hosted UI**: Handles email/password and social logins
3. **Redirect**: Returns to `/onboarding` with authorization code
4. **Session Storage**: JWT tokens stored by AWS Amplify

```
User → SignIn → Cognito UI → /onboarding → Home
```

### AWS Integration

#### Cognito Authentication
- **User Pool**: Manages user credentials and profiles
- **Identity Pool**: Provides temporary AWS credentials for S3 uploads
- **Hosted UI**: Cognito-managed sign-in interface with social providers

#### S3 File Storage
- Direct uploads from browser using temporary credentials
- Files stored in `s3://{bucket}/avatars/{userId}/{filename}`
- No backend upload processing needed

#### API Gateway + Lambda
- RESTful endpoints for user info and search history
- JWT authorization via Cognito tokens
- Python Lambda functions with DynamoDB access

## Key Components

### App.jsx
Main application layout with React Router:
- Sidebar navigation
- NavMenu header
- Page routing via `<Outlet />`

### AvatarUpload.jsx
Uploads images directly to S3:
```javascript
1. Get Cognito session
2. Map User Pool token to Identity Pool
3. Get temporary S3 credentials
4. Upload file to S3
5. Show success message
```

**Security**: Uses temporary credentials scoped to user's `/avatars/{userId}/` prefix

### SignIn Page
Initiates Cognito Hosted UI:
```javascript
Auth.federatedSignIn()  // Opens Cognito login
```

Supports:
- Email/password login
- Google OAuth
- Facebook OAuth
- Apple Sign In

### Home Page
Displays search history by calling `/searches` API:
```javascript
GET /searches
Authorization: Bearer {ID_TOKEN}
```

Returns most recent searches (DynamoDB ScanIndexForward=False)

## Available Scripts

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Dependencies

### Production
- **aws-amplify** (^6.0.0): AWS service integrations
- **@aws-sdk/client-s3** (^3.686.0): S3 uploads
- **@aws-sdk/credential-provider-cognito-identity** (^3.686.0): Temp credentials
- **react** (^18.2.0): UI framework
- **react-dom** (^18.2.0): React DOM rendering
- **react-router-dom** (^6.26.0): Client-side routing

### Development
- **vite** (^6.1.0): Build tool & dev server

## API Integration

### GET /user
Fetch current user's profile:
```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE}/user`,
  {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  }
);
const user = await response.json();
```

Response:
```json
{
  "userId": "us-west-1_xxx:...",
  "email": "user@example.com",
  "name": "John Doe",
  "onboardingComplete": false
}
```

### GET /searches
Fetch user's search history:
```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE}/searches`,
  {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  }
);
const searches = await response.json();
```

### POST /searches
Add a new search:
```javascript
await fetch(
  `${import.meta.env.VITE_API_BASE}/searches`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'pizza near me' })
  }
);
```

## Development Tips

### Using Cognito Hosted UI Locally

By default, the dev server runs on `http://localhost:5173`. Cognito redirect URLs must be registered in AWS.

**Option 1**: Update Terraform variable `app_callback_urls` to include localhost:
```bash
-var='app_callback_urls=["http://localhost:5173/onboarding","https://yourdomain.amplifyapp.com/onboarding"]'
```

**Option 2**: Use a subdomain mapping tool:
```bash
# Add to /etc/hosts
127.0.0.1 localhost.mapme.local

# Update Cognito callback to http://localhost.mapme.local:5173/onboarding
```

### Testing Authenticated Requests

Use browser DevTools to get the ID token:
```javascript
// In browser console
const creds = await Auth.currentCredentials();
console.log(creds);
```

Then use it in API calls:
```bash
curl -H "Authorization: Bearer {ID_TOKEN}" \
  https://api.example.com/dev/user
```

### Debugging AWS Integration

Enable AWS SDK logging:
```javascript
import { Logger } from 'aws-amplify';
Logger.LOG_LEVEL = 'DEBUG';
```

## Build for Production

```bash
npm run build
# Output: dist/
```

Then deploy to Amplify or any static hosting:
```bash
# Amplify auto-deploys on git push if configured in Terraform
git push origin main
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Cognito redirect fails | Wrong callback URL | Update Cognito app client or add localhost to redirects |
| S3 upload fails | No credentials | Check Identity Pool configuration and IAM role |
| API returns 401 | Invalid token | Ensure Cognito session is active (`Auth.currentSession()`) |
| Styles/assets missing | Build output issue | Check `dist/` folder exists after `npm run build` |
| Blank page on load | Missing env vars | Verify `.env.local` has all required VITE_* variables |

## Performance Tips

- **Code Splitting**: React Router enables automatic code splitting
- **Lazy Loading**: Load pages only when needed
- **Image Optimization**: Consider compressing avatars before upload
- **Caching**: S3 CloudFront CDN can cache static assets

## Security Considerations

1. **Environment Variables**: Prefix with `VITE_` to expose only necessary values
2. **JWT Tokens**: Stored securely by AWS Amplify (httpOnly cookies when possible)
3. **S3 Uploads**: Temporary credentials have time limit and scoped permissions
4. **API Authorization**: All endpoints require valid Cognito JWT
5. **CORS**: API Gateway has CORS configured for your domain

## Next Steps

- Add map interface for location search
- Implement real-time search results
- Add user profile customization
- Implement search filters and saved locations
- Add social sharing features

## Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Cognito User Pool Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html)