# =====================
# HTTP API Gateway
# =====================

resource "aws_apigatewayv2_api" "product_api" {
  name          = "${var.project_name}-product-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = [
      "date",
      "x-amzn-trace-id",
      "x-amz-apigw-trace-id",
      "content-type",
      "authorization"
    ]
    expose_headers = [
      "date",
      "x-amzn-trace-id",
      "x-amz-apigw-trace-id"
    ]
    max_age = 300
  }
}

# =====================
# Lambda Integrations
# =====================

# Product Lambda Integration
resource "aws_apigatewayv2_integration" "product_lambda" {
  api_id                   = aws_apigatewayv2_api.product_api.id
  integration_type         = "AWS_PROXY"
  integration_method       = "POST"
  payload_format_version   = "2.0"
  integration_uri          = aws_lambda_function.product.arn
}

# Cart Lambda Integration
resource "aws_apigatewayv2_integration" "cart_lambda" {
  api_id                   = aws_apigatewayv2_api.product_api.id
  integration_type         = "AWS_PROXY"
  integration_method       = "POST"
  payload_format_version   = "2.0"
  integration_uri          = aws_lambda_function.cart.arn
}

# Order Lambda Integration
resource "aws_apigatewayv2_integration" "order_lambda" {
  api_id                   = aws_apigatewayv2_api.product_api.id
  integration_type         = "AWS_PROXY"
  integration_method       = "POST"
  payload_format_version   = "2.0"
  integration_uri          = aws_lambda_function.order.arn
}

# =====================
# Product Routes
# =====================

resource "aws_apigatewayv2_route" "product_get" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /product"
  target    = "integrations/${aws_apigatewayv2_integration.product_lambda.id}"
}

resource "aws_apigatewayv2_route" "product_post" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "POST /product"
  target    = "integrations/${aws_apigatewayv2_integration.product_lambda.id}"
}

resource "aws_apigatewayv2_route" "product_review_post" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "POST /product/{id}/review"
  target    = "integrations/${aws_apigatewayv2_integration.product_lambda.id}"
}

resource "aws_apigatewayv2_route" "product_put" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "PUT /product/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.product_lambda.id}"
}

resource "aws_apigatewayv2_route" "product_delete" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "DELETE /product/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.product_lambda.id}"
}

# =====================
# Cart Routes
# =====================

resource "aws_apigatewayv2_route" "cart_get" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /cart/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_lambda.id}"
}

resource "aws_apigatewayv2_route" "cart_post" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "POST /cart"
  target    = "integrations/${aws_apigatewayv2_integration.cart_lambda.id}"
}

resource "aws_apigatewayv2_route" "cart_put" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "PUT /cart/{user_id}/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_lambda.id}"
}

resource "aws_apigatewayv2_route" "cart_delete_item" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "DELETE /cart/{user_id}/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_lambda.id}"
}

resource "aws_apigatewayv2_route" "cart_delete_all" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "DELETE /cart/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_lambda.id}"
}

# =====================
# Order Routes
# =====================

resource "aws_apigatewayv2_route" "order_get" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /order/{order_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

resource "aws_apigatewayv2_route" "order_get_user" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /order/user/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

resource "aws_apigatewayv2_route" "order_post" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "POST /order"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

resource "aws_apigatewayv2_route" "order_delete" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "DELETE /order/{order_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

# =====================
# Lambda Permissions
# =====================

resource "aws_lambda_permission" "product_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.product_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cart_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cart.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.product_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "order_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.product_api.execution_arn}/*/*"
}

# =====================
# Deployment Stage
# =====================

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.product_api.id
  name        = "$default"
  auto_deploy = true

  # CloudWatch logging disabled due to IAM permissions
  # Enable this if your role has logs:CreateLogGroup permission
  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
  #   format = jsonencode({
  #     requestId      = "$context.requestId"
  #     ip             = "$context.identity.sourceIp"
  #     requestTime    = "$context.requestTime"
  #     httpMethod     = "$context.httpMethod"
  #     routeKey       = "$context.routeKey"
  #     status         = "$context.status"
  #     protocol       = "$context.protocol"
  #     responseLength = "$context.responseLength"
  #     integrationLatency = "$context.integration.latency"
  #   })
  # }
}
