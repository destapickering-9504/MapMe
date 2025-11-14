# Lambda Functions Configuration
# Note: Lambda code is deployed independently via CI/CD using AWS CLI
# Terraform manages the function configuration only (runtime, environment vars, etc.)
# The placeholder.zip is used for initial creation only

resource "aws_lambda_function" "user" {
  function_name = "${local.name_prefix}-user"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # Placeholder for initial creation - actual code deployed via CI/CD
  filename         = "${path.module}/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")

  timeout = 10

  environment {
    variables = {
      USERS_TABLE_NAME = aws_dynamodb_table.users.name
      ENVIRONMENT      = local.environment
    }
  }

  tags = local.common_tags

  # Ignore changes to code - managed by CI/CD
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }
}

resource "aws_lambda_function" "searches" {
  function_name = "${local.name_prefix}-searches"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # Placeholder for initial creation - actual code deployed via CI/CD
  filename         = "${path.module}/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")

  timeout = 10

  environment {
    variables = {
      SEARCHES_TABLE = aws_dynamodb_table.searches.name
      ENVIRONMENT    = local.environment
    }
  }

  tags = local.common_tags

  # Ignore changes to code - managed by CI/CD
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }
}

resource "aws_lambda_function" "post_confirmation" {
  function_name = "${local.name_prefix}-post-confirmation"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # Placeholder for initial creation - actual code deployed via CI/CD
  filename         = "${path.module}/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")

  timeout = 10

  environment {
    variables = {
      USERS_TABLE_NAME = aws_dynamodb_table.users.name
      ENVIRONMENT      = local.environment
    }
  }

  tags = local.common_tags

  # Ignore changes to code - managed by CI/CD
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      last_modified
    ]
  }
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvokePostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.this.arn
}
