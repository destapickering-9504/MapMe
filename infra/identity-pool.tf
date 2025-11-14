resource "aws_cognito_identity_pool" "this" {
  identity_pool_name               = "${local.name_prefix}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web.id
    provider_name           = aws_cognito_user_pool.this.endpoint
    server_side_token_check = true
  }

  tags = local.common_tags
}

data "aws_iam_policy_document" "auth_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.this.id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "auth_role" {
  name               = "${local.name_prefix}-auth-role-${local.suffix}"
  assume_role_policy = data.aws_iam_policy_document.auth_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "auth_policy_doc" {
  statement {
    sid     = "AvatarRW"
    actions = ["s3:PutObject", "s3:GetObject"]
    resources = [
      "${aws_s3_bucket.avatars.arn}/avatars/$${cognito-identity.amazonaws.com:sub}/*"
    ]
  }

  statement {
    sid       = "ListOwnPrefix"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.avatars.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["avatars/$${cognito-identity.amazonaws.com:sub}/*"]
    }
  }

  statement {
    sid       = "InvokeApi"
    actions   = ["execute-api:Invoke"]
    resources = ["${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"]
  }
}

resource "aws_iam_policy" "auth_policy" {
  name   = "${local.name_prefix}-auth-policy-${local.suffix}"
  policy = data.aws_iam_policy_document.auth_policy_doc.json
  tags   = local.common_tags
}

resource "aws_iam_role_policy_attachment" "attach_auth" {
  role       = aws_iam_role.auth_role.name
  policy_arn = aws_iam_policy.auth_policy.arn
}

resource "aws_cognito_identity_pool_roles_attachment" "attach" {
  identity_pool_id = aws_cognito_identity_pool.this.id
  roles = {
    "authenticated" = aws_iam_role.auth_role.arn
  }
}
