resource "aws_cognito_user_pool" "this" {
  name = "${local.project}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                = "picture"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name                          = "${local.project}-web-client"
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
  domain       = var.cognito_domain_prefix != "" ? var.cognito_domain_prefix : "${local.project}-${local.suffix}"
  user_pool_id = aws_cognito_user_pool.this.id
}
