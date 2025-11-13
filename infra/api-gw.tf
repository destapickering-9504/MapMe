resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "${local.name_prefix}-api"
  description = "MapMe REST API - ${title(local.environment)} Environment"

  tags = local.common_tags
}

resource "aws_api_gateway_resource" "user_res" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = local.routes.user
}

resource "aws_api_gateway_resource" "searches_res" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  parent_id   = aws_api_gateway_rest_api.rest_api.root_resource_id
  path_part   = local.routes.searches
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${local.name_prefix}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.rest_api.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.this.arn]
  identity_source = "method.request.header.Authorization"
}

resource "aws_api_gateway_method" "user_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.user_res.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "user_get" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.user_res.id
  http_method             = aws_api_gateway_method.user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user.invoke_arn
}

resource "aws_lambda_permission" "apigw_user" {
  statement_id  = "AllowAPIGatewayInvokeUser"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "searches_get" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.searches_res.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "searches_post" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  resource_id   = aws_api_gateway_resource.searches_res.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "searches_get" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.searches_res.id
  http_method             = aws_api_gateway_method.searches_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.searches.invoke_arn
}

resource "aws_api_gateway_integration" "searches_post" {
  rest_api_id             = aws_api_gateway_rest_api.rest_api.id
  resource_id             = aws_api_gateway_resource.searches_res.id
  http_method             = aws_api_gateway_method.searches_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.searches.invoke_arn
}

resource "aws_lambda_permission" "apigw_searches" {
  statement_id  = "AllowAPIGatewayInvokeSearches"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.searches.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deploy" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  depends_on = [
    aws_api_gateway_integration.user_get,
    aws_api_gateway_integration.searches_get,
    aws_api_gateway_integration.searches_post,
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.user_res.id,
      aws_api_gateway_resource.searches_res.id,
      aws_api_gateway_method.user_get.id,
      aws_api_gateway_method.searches_get.id,
      aws_api_gateway_method.searches_post.id,
      aws_api_gateway_integration.user_get.id,
      aws_api_gateway_integration.searches_get.id,
      aws_api_gateway_integration.searches_post.id,
    ]))
  }

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "stage" {
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  deployment_id = aws_api_gateway_deployment.deploy.id
  stage_name    = local.environment

  tags = local.common_tags
}
