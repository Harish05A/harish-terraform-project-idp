# =====================
# Step 2: Product Lambda
# =====================

output "product_lambda_function_name" {
  description = "Product Lambda function name"
  value       = aws_lambda_function.product.function_name
}

output "product_lambda_arn" {
  description = "Product Lambda function ARN"
  value       = aws_lambda_function.product.arn
}

output "product_lambda_role_arn" {
  description = "Product Lambda IAM role ARN"
  value       = aws_iam_role.product_lambda_role.arn
}

# =====================
# Step 3: DynamoDB Tables
# =====================

output "products_table_name" {
  description = "Products DynamoDB table name"
  value       = aws_dynamodb_table.products.name
}

output "products_table_arn" {
  description = "Products DynamoDB table ARN"
  value       = aws_dynamodb_table.products.arn
}

output "carts_table_name" {
  description = "Carts DynamoDB table name"
  value       = aws_dynamodb_table.carts.name
}

output "carts_table_arn" {
  description = "Carts DynamoDB table ARN"
  value       = aws_dynamodb_table.carts.arn
}

output "orders_table_name" {
  description = "Orders DynamoDB table name"
  value       = aws_dynamodb_table.orders.name
}

output "orders_table_arn" {
  description = "Orders DynamoDB table ARN"
  value       = aws_dynamodb_table.orders.arn
}

# =====================
# Step 4: API Gateway
# =====================

output "api_endpoint" {
  description = "API Gateway base URL"
  value       = "${aws_apigatewayv2_api.product_api.api_endpoint}/"
}

output "api_v1_endpoint" {
  description = "Versioned API v1 base URL"
  value       = "${aws_apigatewayv2_api.product_api.api_endpoint}/v1/"
}

output "api_id" {
  description = "API Gateway API ID"
  value       = aws_apigatewayv2_api.product_api.id
}

# =====================
# Step 5: Cart & Order Lambda
# =====================

output "cart_lambda_function_name" {
  description = "Cart Lambda function name"
  value       = aws_lambda_function.cart.function_name
}

output "cart_lambda_arn" {
  description = "Cart Lambda function ARN"
  value       = aws_lambda_function.cart.arn
}

output "order_lambda_function_name" {
  description = "Order Lambda function name"
  value       = aws_lambda_function.order.function_name
}

output "order_lambda_arn" {
  description = "Order Lambda function ARN"
  value       = aws_lambda_function.order.arn
}

output "bff_lambda_function_name" {
  description = "BFF Lambda function name"
  value       = aws_lambda_function.bff.function_name
}

output "bff_lambda_arn" {
  description = "BFF Lambda function ARN"
  value       = aws_lambda_function.bff.arn
}

# =====================
# API Routes Summary
# =====================

output "api_routes" {
  description = "Primary API v1 routes; legacy unversioned routes remain for compatibility"
  value = {
    product = {
      "GET /v1/products"              = "List all products"
      "POST /v1/products"             = "Create product"
      "POST /v1/products/{id}/review" = "Create product review"
      "PUT /v1/products/{id}"         = "Update product"
      "DELETE /v1/products/{id}"      = "Delete product"
    }
    cart = {
      "GET /v1/cart/{user_id}"                 = "Get user's cart"
      "POST /v1/cart"                          = "Add item to cart"
      "PUT /v1/cart/{user_id}/{product_id}"    = "Update item quantity"
      "DELETE /v1/cart/{user_id}/{product_id}" = "Remove item from cart"
      "DELETE /v1/cart/{user_id}"              = "Clear entire cart"
    }
    order = {
      "GET /v1/orders/{order_id}"     = "Get order details"
      "GET /v1/orders/user/{user_id}" = "Get user's orders"
      "POST /v1/orders"               = "Create order from cart"
      "DELETE /v1/orders/{order_id}"  = "Cancel order"
    }
    bff = {
      "GET /v1/bff/dashboard" = "Retrieve aggregated dashboard details (cart, recent orders, recommendations)"
    }
  }
}

# =====================
# Step 6: S3 Frontend
# =====================

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_website_url" {
  description = "Frontend website URL (CloudFront)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_url" {
  description = "Frontend application URL (CloudFront HTTPS)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for cache invalidation on deploy)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_health_check_id" {
  description = "Route53 health check ID for frontend availability"
  value       = aws_route53_health_check.frontend_health_check.id
}

# output "frontend_alert_topic_arn" {
#   description = "SNS topic ARN used for frontend downtime alerts"
#   value       = aws_sns_topic.frontend_alerts.arn
# }

# output "frontend_downtime_alarm_name" {
#   description = "CloudWatch alarm name that triggers when the frontend is down"
#   value       = aws_cloudwatch_metric_alarm.frontend_downtime_alarm.alarm_name
# }

# =====================
# Complete System Summary
# =====================

output "system_summary" {
  description = "Complete system information"
  value = {
    frontend_url = "https://${aws_cloudfront_distribution.frontend.domain_name}"
    api_url      = "${aws_apigatewayv2_api.product_api.api_endpoint}/"
    api_v1_url   = "${aws_apigatewayv2_api.product_api.api_endpoint}/v1/"
    region       = var.aws_region
    project_name = var.project_name
    profile      = "idp-sbx-trn-lab-01"
    deployment   = "Complete"
  }
}
