resource "aws_cognito_user_pool" "this" {
  name = "${local.name_prefix}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Welcome to MapMe! Confirm your email"
    email_message        = <<-EOT
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="https://${aws_cloudfront_distribution.frontend.domain_name}/MapMeLogo.png" alt="MapMe Logo" style="max-width: 200px; margin-bottom: 20px;" />
          <h1 style="color: #333;">Welcome to MapMe!</h1>
          <p style="font-size: 16px; color: #666;">We're excited to have you on board.</p>
          <p style="font-size: 16px; color: #666;">To complete your registration and start exploring, please use the following verification code:</p>
          <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">{####}</h2>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
        </body>
      </html>
    EOT
  }

  lambda_config {
    post_confirmation = aws_lambda_function.post_confirmation.arn
  }

  schema {
    name                = "picture"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  lifecycle {
    ignore_changes = [schema]
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "web" {
  name                          = "${local.name_prefix}-web-client"
  user_pool_id                  = aws_cognito_user_pool.this.id
  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
  supported_identity_providers  = ["COGNITO"] # Only email/password for now

  callback_urls = var.app_callback_urls
  logout_urls   = var.app_logout_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  refresh_token_validity               = 30
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = var.cognito_domain_prefix != "" ? var.cognito_domain_prefix : "${local.name_prefix}-${local.suffix}"
  user_pool_id = aws_cognito_user_pool.this.id
}
