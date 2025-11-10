variable "aws_region" {
  description = "AWS region for deployment (configurable via TF_VAR_aws_region environment variable)"
  type        = string
  default     = "us-west-1"
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

variable "cognito_domain_prefix" {
  description = "Optional custom hosted UI domain prefix"
  type        = string
  default     = ""
}
