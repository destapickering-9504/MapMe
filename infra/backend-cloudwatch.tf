# CloudWatch Alarms for Lambda Functions and API Gateway

# SNS Topic for alarm notifications
resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-alarms-${local.suffix}"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Lambda - User Handler Alarms

resource "aws_cloudwatch_metric_alarm" "user_lambda_errors" {
  alarm_name          = "${local.name_prefix}-user-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm triggers when user Lambda has more than 5 errors in 5 minutes"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.user.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "user_lambda_throttles" {
  alarm_name          = "${local.name_prefix}-user-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm triggers when user Lambda is throttled more than 10 times in 5 minutes"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.user.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "user_lambda_duration" {
  alarm_name          = "${local.name_prefix}-user-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 8000 # 80% of 10 second timeout
  alarm_description   = "This alarm triggers when user Lambda duration approaches timeout"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.user.function_name
  }

  tags = local.common_tags
}

# Lambda - Searches Handler Alarms

resource "aws_cloudwatch_metric_alarm" "searches_lambda_errors" {
  alarm_name          = "${local.name_prefix}-searches-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm triggers when searches Lambda has more than 5 errors in 5 minutes"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.searches.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "searches_lambda_throttles" {
  alarm_name          = "${local.name_prefix}-searches-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm triggers when searches Lambda is throttled more than 10 times in 5 minutes"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.searches.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "searches_lambda_duration" {
  alarm_name          = "${local.name_prefix}-searches-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 8000 # 80% of 10 second timeout
  alarm_description   = "This alarm triggers when searches Lambda duration approaches timeout"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.searches.function_name
  }

  tags = local.common_tags
}

# API Gateway Alarms

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${local.name_prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm triggers when API Gateway has more than 10 5xx errors in 5 minutes"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.rest_api.name
    Stage   = aws_api_gateway_stage.stage.stage_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${local.name_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 50 # Higher threshold as 4xx can be normal (auth failures, validation, etc.)
  alarm_description   = "This alarm triggers when API Gateway has an unusually high rate of 4xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.rest_api.name
    Stage   = aws_api_gateway_stage.stage.stage_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.name_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 5000 # 5 seconds
  alarm_description   = "This alarm triggers when API Gateway latency is consistently high"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.rest_api.name
    Stage   = aws_api_gateway_stage.stage.stage_name
  }

  tags = local.common_tags
}
