# Development Environment Configuration
environment = "dev"
aws_region  = "us-west-1"

# Callback URLs for development (includes localhost for local testing)
app_callback_urls = [
  "http://localhost:3000",
  "https://dev.mapme.com"
]

# Logout URLs for development
app_logout_urls = [
  "http://localhost:3000",
  "https://dev.mapme.com"
]

# Optional: Cognito domain prefix for dev environment
# cognito_domain_prefix = "mapme-dev"
