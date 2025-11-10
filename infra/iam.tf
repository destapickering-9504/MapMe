data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${local.project}-lambda-role-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_policy_doc" {
  statement {
    actions = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
    resources = ["arn:aws:logs:${var.aws_region}:*:*"]
  }
  statement {
    actions = ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:Query","dynamodb:UpdateItem","dynamodb:Scan"]
    resources = [
      aws_dynamodb_table.users.arn,
      aws_dynamodb_table.searches.arn,
      "${aws_dynamodb_table.searches.arn}/index/*"
    ]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  name   = "${local.project}-lambda-policy-${local.suffix}"
  policy = data.aws_iam_policy_document.lambda_policy_doc.json
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}
