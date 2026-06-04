# =====================
# Products DynamoDB Table
# =====================

resource "aws_dynamodb_table" "products" {
  name         = "${var.project_name}-products"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "product_id"

  attribute {
    name = "product_id"
    type = "S" # String type for product IDs
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = {
    Description = "Product catalog"
  }
}

# =====================
# Carts DynamoDB Table
# =====================

resource "aws_dynamodb_table" "carts" {
  name         = "${var.project_name}-carts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S" # String type for user IDs
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = {
    Description = "Shopping carts"
  }
}

# =====================
# Orders DynamoDB Table
# =====================

resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S" # String type for order IDs
  }

  attribute {
    name = "user_id"
    type = "S" # String type for user IDs (for GSI)
  }

  # Global Secondary Index for querying orders by user_id
  global_secondary_index {
    name            = "user_id-index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = {
    Description = "Order history"
  }
}
