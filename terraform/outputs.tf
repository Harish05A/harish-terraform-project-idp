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
  description = "Product API endpoint URL"
  value       = "${aws_apigatewayv2_api.product_api.api_endpoint}/"
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

# =====================
# API Routes Summary
# =====================

output "api_routes" {
  description = "All available API routes"
  value = {
    product = {
      "GET /product"         = "List all products"
      "POST /product"        = "Create product"
      "PUT /product/{id}"    = "Update product"
      "DELETE /product/{id}" = "Delete product"
    }
    cart = {
      "GET /cart/{user_id}"                    = "Get user's cart"
      "POST /cart"                             = "Add item to cart"
      "PUT /cart/{user_id}/{product_id}"       = "Update item quantity"
      "DELETE /cart/{user_id}/{product_id}"    = "Remove item from cart"
      "DELETE /cart/{user_id}"                 = "Clear entire cart"
    }
    order = {
      "GET /order/{order_id}"       = "Get order details"
      "GET /order/user/{user_id}"   = "Get user's orders"
      "POST /order"                 = "Create order from cart"
      "DELETE /order/{order_id}"    = "Cancel order"
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
  description = "Frontend website URL"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

# =====================
# Complete System Summary
# =====================

output "system_summary" {
  description = "Complete system information"
  value = {
    frontend_url  = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
    api_url       = "${aws_apigatewayv2_api.product_api.api_endpoint}/"
    region        = var.aws_region
    project_name  = var.project_name
    profile       = "idp-sbx-trn-lab-01"
    deployment    = "Complete"
  }
}
