data "archive_file" "user_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_src/user_handler"
  output_path = "${path.module}/lambda_src/user_handler.zip"
}

resource "aws_lambda_function" "user" {
  function_name = "${local.name_prefix}-user"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  filename      = data.archive_file.user_lambda_zip.output_path
  timeout       = 10
  
  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      ENVIRONMENT = local.environment
    }
  }

  tags = local.common_tags
}

data "archive_file" "searches_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_src/searches_handler"
  output_path = "${path.module}/lambda_src/searches_handler.zip"
}

resource "aws_lambda_function" "searches" {
  function_name = "${local.name_prefix}-searches"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  filename      = data.archive_file.searches_lambda_zip.output_path
  timeout       = 10
  
  environment {
    variables = {
      SEARCHES_TABLE = aws_dynamodb_table.searches.name
      ENVIRONMENT    = local.environment
    }
  }

  tags = local.common_tags
}
