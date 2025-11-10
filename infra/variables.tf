variable "aws_region" {
  description = "AWS region for deployment (configurable via TF_VAR_aws_region environment variable)"
  type        = string
  default     = "us-west-1"
}

variable "amplify_repo" {
  description = "Git repository URL for Amplify hosting"
  type        = string
  default     = "https://github.com/dummy/repo"
}

variable "amplify_access_token" {
  description = "Access token for Amplify to connect to your repo"
  type        = string
  sensitive   = true
  default     = "dummy"
}

variable "amplify_branch" {
  description = "Repository branch to build"
  type        = string
  default     = "main"
}

variable "app_callback_urls" {
  description = "Allowed redirect URIs after sign-in"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "app_logout_urls" {
  description = "Allowed sign-out redirect URIs"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "google_client_id" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "facebook_app_id" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "facebook_app_secret" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "apple_team_id" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "apple_services_id" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "apple_key_id" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "apple_private_key_p8" {
  type      = string
  sensitive = true
  default   = "dummy"
}

variable "cognito_domain_prefix" {
  description = "Optional custom hosted UI domain prefix"
  type        = string
  default     = ""
}
