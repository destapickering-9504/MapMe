resource "aws_cognito_user_pool" "this" {
  name = "${local.project}-user-pool"

  username_attributes       = ["email"]
  auto_verified_attributes  = ["email"]

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
  name                                 = "${local.project}-web-client"
  user_pool_id                         = aws_cognito_user_pool.this.id
  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  supported_identity_providers         = ["COGNITO"]  # Only email/password for now

  callback_urls                        = var.app_callback_urls
  logout_urls                          = var.app_logout_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  refresh_token_validity               = 30
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = var.cognito_domain_prefix != "" ? var.cognito_domain_prefix : "${local.project}-${local.suffix}"
  user_pool_id = aws_cognito_user_pool.this.id
}

# OAuth Identity Providers - DISABLED (using dummy credentials)
# Uncomment and configure with real credentials to enable social login

# resource "aws_cognito_identity_provider" "google" {
#   user_pool_id  = aws_cognito_user_pool.this.id
#   provider_name = "Google"
#   provider_type = "Google"
#   provider_details = {
#     client_id        = var.google_client_id
#     client_secret    = var.google_client_secret
#     authorize_scopes = "openid email profile"
#   }
#   attribute_mapping = {
#     email       = "email"
#     name        = "name"
#     picture     = "picture"
#     given_name  = "given_name"
#     family_name = "family_name"
#     username    = "sub"
#   }
# }

# resource "aws_cognito_identity_provider" "facebook" {
#   user_pool_id  = aws_cognito_user_pool.this.id
#   provider_name = "Facebook"
#   provider_type = "Facebook"
#   provider_details = {
#     client_id        = var.facebook_app_id
#     client_secret    = var.facebook_app_secret
#     authorize_scopes = "public_profile,email"
#   }
#   attribute_mapping = {
#     email    = "email"
#     name     = "name"
#     picture  = "picture.data.url"
#     username = "id"
#   }
# }

# resource "aws_cognito_identity_provider" "apple" {
#   user_pool_id  = aws_cognito_user_pool.this.id
#   provider_name = "SignInWithApple"
#   provider_type = "SignInWithApple"
#   provider_details = {
#     client_id        = var.apple_services_id
#     team_id          = var.apple_team_id
#     key_id           = var.apple_key_id
#     private_key      = var.apple_private_key_p8
#     authorize_scopes = "name email"
#   }
#   attribute_mapping = {
#     email    = "email"
#     username = "sub"
#     name     = "name"
#   }
# }
