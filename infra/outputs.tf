# Cognito Outputs
output "cognito_user_pool_id"        { value = aws_cognito_user_pool.this.id }
output "cognito_user_pool_client_id" { value = aws_cognito_user_pool_client.web.id }
output "cognito_identity_pool_id"    { value = aws_cognito_identity_pool.this.id }
output "cognito_hosted_ui_domain"    { value = aws_cognito_user_pool_domain.domain.domain }

# Storage Outputs
output "avatars_bucket"              { value = aws_s3_bucket.avatars.bucket }
output "frontend_bucket"             { value = aws_s3_bucket.frontend.bucket }

# API Gateway Output
output "api_base_url" {
  value = "https://${aws_api_gateway_rest_api.rest_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.stage.stage_name}"
}

# Frontend Hosting Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name for accessing the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# Legacy Amplify output - DISABLED (using S3/CloudFront instead)
# Uncomment if you re-enable Amplify hosting
# output "amplify_default_domain" { 
#   value       = aws_amplify_app.app.default_domain
#   description = "Amplify domain"
# }
