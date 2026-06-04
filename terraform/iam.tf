# =====================
# Product Lambda IAM Role
# =====================

# Trust policy for Lambda service
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Product Lambda execution role
resource "aws_iam_role" "product_lambda_role" {
  name               = "${var.project_name}-product-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# Attach basic Lambda execution policy (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "product_lambda_basic_execution" {
  role       = aws_iam_role.product_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for DynamoDB access (Product and Orders tables)
data "aws_iam_policy_document" "product_lambda_dynamodb" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query"
    ]

    resources = [
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-products",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-orders",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-orders/index/*"
    ]
  }
}

# Attach DynamoDB policy to Product Lambda role
resource "aws_iam_role_policy" "product_lambda_dynamodb" {
  name   = "${var.project_name}-product-lambda-dynamodb-policy"
  role   = aws_iam_role.product_lambda_role.id
  policy = data.aws_iam_policy_document.product_lambda_dynamodb.json
}

# =====================
# Cart Lambda IAM Role
# =====================

resource "aws_iam_role" "cart_lambda_role" {
  name               = "${var.project_name}-cart-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "cart_lambda_basic_execution" {
  role       = aws_iam_role.cart_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for DynamoDB access (Cart and Products tables)
data "aws_iam_policy_document" "cart_lambda_dynamodb" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query"
    ]

    resources = [
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-carts",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-products"
    ]
  }
}

resource "aws_iam_role_policy" "cart_lambda_dynamodb" {
  name   = "${var.project_name}-cart-lambda-dynamodb-policy"
  role   = aws_iam_role.cart_lambda_role.id
  policy = data.aws_iam_policy_document.cart_lambda_dynamodb.json
}

# =====================
# Order Lambda IAM Role
# =====================

resource "aws_iam_role" "order_lambda_role" {
  name               = "${var.project_name}-order-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "order_lambda_basic_execution" {
  role       = aws_iam_role.order_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "order_lambda_xray" {
  role       = aws_iam_role.order_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Policy for DynamoDB access (Orders and Carts tables)
data "aws_iam_policy_document" "order_lambda_dynamodb" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query"
    ]

    resources = [
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-orders",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-carts",
      "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-orders/index/*"
    ]
  }
}

resource "aws_iam_role_policy" "order_lambda_dynamodb" {
  name   = "${var.project_name}-order-lambda-dynamodb-policy"
  role   = aws_iam_role.order_lambda_role.id
  policy = data.aws_iam_policy_document.order_lambda_dynamodb.json
}

data "aws_iam_policy_document" "order_lambda_sns" {
  statement {
    effect = "Allow"
    actions = ["sns:Publish"]
    resources = [aws_sns_topic.frontend_alerts.arn]
  }
}

resource "aws_iam_role_policy" "order_lambda_sns" {
  name   = "${var.project_name}-order-lambda-sns-policy"
  role   = aws_iam_role.order_lambda_role.id
  policy = data.aws_iam_policy_document.order_lambda_sns.json
}

data "aws_iam_policy_document" "monitor_sns_policy" {
  statement {
    effect = "Allow"

    actions = [
      "sns:Publish"
    ]

    resources = [
      aws_sns_topic.frontend_alerts.arn
    ]
  }
}

resource "aws_iam_role_policy" "monitor_sns_policy" {
  name   = "${var.project_name}-monitor-sns-policy"
  role   = aws_iam_role.product_lambda_role.id
  policy = data.aws_iam_policy_document.monitor_sns_policy.json
}
