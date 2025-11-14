# Package user handler with common utilities
data "archive_file" "user_lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_src/user_handler.zip"

  source {
    content  = file("${path.module}/lambda_src/user_handler/index.py")
    filename = "index.py"
  }

  source {
    content  = file("${path.module}/lambda_src/user_handler/__init__.py")
    filename = "__init__.py"
  }

  source {
    content  = file("${path.module}/lambda_src/common/utils.py")
    filename = "common/utils.py"
  }

  source {
    content  = file("${path.module}/lambda_src/common/__init__.py")
    filename = "common/__init__.py"
  }
}

resource "aws_lambda_function" "user" {
  function_name    = "${local.name_prefix}-user"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  filename         = data.archive_file.user_lambda_zip.output_path
  source_code_hash = data.archive_file.user_lambda_zip.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      USERS_TABLE_NAME = aws_dynamodb_table.users.name
      ENVIRONMENT      = local.environment
    }
  }

  tags = local.common_tags
}

# Package searches handler with common utilities
data "archive_file" "searches_lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_src/searches_handler.zip"

  source {
    content  = file("${path.module}/lambda_src/searches_handler/index.py")
    filename = "index.py"
  }

  source {
    content  = file("${path.module}/lambda_src/searches_handler/__init__.py")
    filename = "__init__.py"
  }

  source {
    content  = file("${path.module}/lambda_src/common/utils.py")
    filename = "common/utils.py"
  }

  source {
    content  = file("${path.module}/lambda_src/common/__init__.py")
    filename = "common/__init__.py"
  }
}

resource "aws_lambda_function" "searches" {
  function_name    = "${local.name_prefix}-searches"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  filename         = data.archive_file.searches_lambda_zip.output_path
  source_code_hash = data.archive_file.searches_lambda_zip.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      SEARCHES_TABLE = aws_dynamodb_table.searches.name
      ENVIRONMENT    = local.environment
    }
  }

  tags = local.common_tags
}
