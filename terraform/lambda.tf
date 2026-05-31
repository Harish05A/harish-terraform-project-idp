# =====================
# Product Lambda
# =====================

# Automatically zip Product Lambda code
data "archive_file" "product_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/../backend/product.zip"
  excludes    = ["cart/*", "order/*", "monitoring/*", "*.zip", "**/.pytest_cache/*", "**/__pycache__/*"]
}

# Product Lambda Function
resource "aws_lambda_function" "product" {
  filename      = data.archive_file.product_lambda_zip.output_path
  function_name = "${var.project_name}-product"
  role          = aws_iam_role.product_lambda_role.arn
  handler       = "product.lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.product_lambda_zip.output_base64sha256

  environment {
    variables = {
      REGION_NAME    = var.aws_region
      PRODUCTS_TABLE = "${var.project_name}-products"
      ORDERS_TABLE   = "${var.project_name}-orders"
    }
  }

  timeout = 30

  depends_on = [
    aws_iam_role_policy_attachment.product_lambda_basic_execution,
    aws_iam_role_policy.product_lambda_dynamodb
  ]
}

# =====================
# Cart Lambda
# =====================

# Automatically zip Cart Lambda code
data "archive_file" "cart_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/../backend/cart.zip"
  excludes    = ["product/*", "order/*", "monitoring/*", "*.zip", "**/.pytest_cache/*", "**/__pycache__/*"]
}

# Cart Lambda Function
resource "aws_lambda_function" "cart" {
  filename      = data.archive_file.cart_lambda_zip.output_path
  function_name = "${var.project_name}-cart"
  role          = aws_iam_role.cart_lambda_role.arn
  handler       = "cart.lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.cart_lambda_zip.output_base64sha256

  environment {
    variables = {
      REGION_NAME    = var.aws_region
      CARTS_TABLE    = "${var.project_name}-carts"
      PRODUCTS_TABLE = "${var.project_name}-products"
    }
  }

  timeout = 30

  depends_on = [
    aws_iam_role_policy_attachment.cart_lambda_basic_execution,
    aws_iam_role_policy.cart_lambda_dynamodb
  ]
}

# =====================
# Order Lambda
# =====================

# Automatically zip Order Lambda code
data "archive_file" "order_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/../backend/order.zip"
  excludes    = ["product/*", "cart/*", "monitoring/*", "*.zip", "**/.pytest_cache/*", "**/__pycache__/*"]
}

# Order Lambda Function
resource "aws_lambda_function" "order" {
  filename      = data.archive_file.order_lambda_zip.output_path
  function_name = "${var.project_name}-order"
  role          = aws_iam_role.order_lambda_role.arn
  handler       = "order.lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.order_lambda_zip.output_base64sha256

  environment {
    variables = {
      REGION_NAME  = var.aws_region
      ORDERS_TABLE = "${var.project_name}-orders"
      CARTS_TABLE  = "${var.project_name}-carts"
      TOPIC_ARN    = aws_sns_topic.frontend_alerts.arn
    }
  }

  timeout = 30

  depends_on = [
    aws_iam_role_policy_attachment.order_lambda_basic_execution,
    aws_iam_role_policy.order_lambda_dynamodb
  ]
}

data "archive_file" "monitoring_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/../backend/monitoring.zip"
  excludes    = ["product/*", "cart/*", "order/*", "*.zip", "**/.pytest_cache/*", "**/__pycache__/*"]
}

resource "aws_lambda_function" "monitor_lambda" {
  filename         = data.archive_file.monitoring_lambda_zip.output_path
  function_name    = "${var.project_name}-monitor"
  source_code_hash = data.archive_file.monitoring_lambda_zip.output_base64sha256

  handler = "monitoring.lambda_function.lambda_handler"
  runtime = var.python_runtime

  role = aws_iam_role.product_lambda_role.arn

  environment {
    variables = {
      REGION_NAME = var.aws_region
      # URL       = "http://wrong-url"
      URL       = "http://${replace(aws_s3_bucket_website_configuration.frontend.website_endpoint, "http://", "")}"
      TOPIC_ARN = aws_sns_topic.frontend_alerts.arn
    }
  }
}
