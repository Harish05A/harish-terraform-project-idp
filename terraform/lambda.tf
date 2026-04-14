# =====================
# Product Lambda
# =====================

# Automatically zip Product Lambda code
data "archive_file" "product_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/product"
  output_path = "${path.module}/../backend/product.zip"
}

# Product Lambda Function
resource "aws_lambda_function" "product" {
  filename      = data.archive_file.product_lambda_zip.output_path
  function_name = "${var.project_name}-product"
  role          = aws_iam_role.product_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.product_lambda_zip.output_base64sha256

  environment {
    variables = {
      PRODUCTS_TABLE = "${var.project_name}-products"
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
  source_dir  = "${path.module}/../backend/cart"
  output_path = "${path.module}/../backend/cart.zip"
}

# Cart Lambda Function
resource "aws_lambda_function" "cart" {
  filename      = data.archive_file.cart_lambda_zip.output_path
  function_name = "${var.project_name}-cart"
  role          = aws_iam_role.cart_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.cart_lambda_zip.output_base64sha256

  environment {
    variables = {
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
  source_dir  = "${path.module}/../backend/order"
  output_path = "${path.module}/../backend/order.zip"
}

# Order Lambda Function
resource "aws_lambda_function" "order" {
  filename      = data.archive_file.order_lambda_zip.output_path
  function_name = "${var.project_name}-order"
  role          = aws_iam_role.order_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = var.python_runtime

  source_code_hash = data.archive_file.order_lambda_zip.output_base64sha256

  environment {
    variables = {
      ORDERS_TABLE = "${var.project_name}-orders"
      CARTS_TABLE  = "${var.project_name}-carts"
    }
  }

  timeout = 30

  depends_on = [
    aws_iam_role_policy_attachment.order_lambda_basic_execution,
    aws_iam_role_policy.order_lambda_dynamodb
  ]
}
