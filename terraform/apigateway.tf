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
      "x-correlation-id",
      "content-type",
      "authorization"
    ]
    expose_headers = [
      "date",
      "x-amzn-trace-id",
      "x-amz-apigw-trace-id",
      "x-correlation-id"
    ]
    max_age = 300
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-product-api"
  retention_in_days = 7
}

# =====================
# Lambda Integrations
# =====================

# Product Lambda Integration
resource "aws_apigatewayv2_integration" "product_lambda" {
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.product.arn
}

# Cart Lambda Integration
resource "aws_apigatewayv2_integration" "cart_lambda" {
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.cart.arn
}

# Order Lambda Integration
resource "aws_apigatewayv2_integration" "order_lambda" {
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.order.arn
}

locals {
  v1_product_routes = {
    product_get = {
      route_key    = "GET /v1/products"
      rewrite_path = "/product"
    }
    product_post = {
      route_key    = "POST /v1/products"
      rewrite_path = "/product"
    }
    product_review_post = {
      route_key    = "POST /v1/products/{id}/review"
      rewrite_path = "/product/$request.path.id/review"
    }
    product_put = {
      route_key    = "PUT /v1/products/{id}"
      rewrite_path = "/product/$request.path.id"
    }
    product_delete = {
      route_key    = "DELETE /v1/products/{id}"
      rewrite_path = "/product/$request.path.id"
    }
  }

  v1_cart_routes = {
    cart_get = {
      route_key    = "GET /v1/cart/{user_id}"
      rewrite_path = "/cart/$request.path.user_id"
    }
    cart_post = {
      route_key    = "POST /v1/cart"
      rewrite_path = "/cart"
    }
    cart_put = {
      route_key    = "PUT /v1/cart/{user_id}/{product_id}"
      rewrite_path = "/cart/$request.path.user_id/$request.path.product_id"
    }
    cart_delete_item = {
      route_key    = "DELETE /v1/cart/{user_id}/{product_id}"
      rewrite_path = "/cart/$request.path.user_id/$request.path.product_id"
    }
    cart_delete_all = {
      route_key    = "DELETE /v1/cart/{user_id}"
      rewrite_path = "/cart/$request.path.user_id"
    }
  }

  v1_order_routes = {
    order_get_all = {
      route_key    = "GET /v1/orders"
      rewrite_path = "/order"
    }
    order_get = {
      route_key    = "GET /v1/orders/{order_id}"
      rewrite_path = "/order/$request.path.order_id"
    }
    order_get_user = {
      route_key    = "GET /v1/orders/user/{user_id}"
      rewrite_path = "/order/user/$request.path.user_id"
    }
    order_post = {
      route_key    = "POST /v1/orders"
      rewrite_path = "/order"
    }
    order_delete = {
      route_key    = "DELETE /v1/orders/{order_id}"
      rewrite_path = "/order/$request.path.order_id"
    }
    order_put_status = {
      route_key    = "PUT /v1/orders/{order_id}/status"
      rewrite_path = "/order/$request.path.order_id/status"
    }
  }
}

# =====================
# Product Routes
# =====================

resource "aws_apigatewayv2_integration" "v1_product_lambda" {
  for_each               = local.v1_product_routes
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.product.arn
  request_parameters = {
    "overwrite:path" = each.value.rewrite_path
  }
}

resource "aws_apigatewayv2_route" "v1_product" {
  for_each  = local.v1_product_routes
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.v1_product_lambda[each.key].id}"
}

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

resource "aws_apigatewayv2_integration" "v1_cart_lambda" {
  for_each               = local.v1_cart_routes
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.cart.arn
  request_parameters = {
    "overwrite:path" = each.value.rewrite_path
  }
}

resource "aws_apigatewayv2_route" "v1_cart" {
  for_each  = local.v1_cart_routes
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.v1_cart_lambda[each.key].id}"
}

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

resource "aws_apigatewayv2_integration" "v1_order_lambda" {
  for_each               = local.v1_order_routes
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.order.arn
  request_parameters = {
    "overwrite:path" = each.value.rewrite_path
  }
}

resource "aws_apigatewayv2_route" "v1_order" {
  for_each  = local.v1_order_routes
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.v1_order_lambda[each.key].id}"
}

resource "aws_apigatewayv2_route" "order_get" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /order/{order_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

resource "aws_apigatewayv2_route" "order_get_all" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /order"
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

resource "aws_apigatewayv2_route" "order_put_status" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "PUT /order/{order_id}/status"
  target    = "integrations/${aws_apigatewayv2_integration.order_lambda.id}"
}

# BFF Route & Integration
resource "aws_apigatewayv2_integration" "bff_lambda" {
  api_id                 = aws_apigatewayv2_api.product_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  payload_format_version = "2.0"
  integration_uri        = aws_lambda_function.bff.arn
}

resource "aws_apigatewayv2_route" "bff_route" {
  api_id    = aws_apigatewayv2_api.product_api.id
  route_key = "GET /v1/bff/dashboard"
  target    = "integrations/${aws_apigatewayv2_integration.bff_lambda.id}"
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

resource "aws_lambda_permission" "bff_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bff.function_name
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

  default_route_settings {
    throttling_burst_limit = 200
    throttling_rate_limit  = 100
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      protocol           = "$context.protocol"
      responseLength     = "$context.responseLength"
      integrationLatency = "$context.integration.latency"
      userAgent          = "$context.identity.userAgent"
    })
  }
}
