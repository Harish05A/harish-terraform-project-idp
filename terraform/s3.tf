# =====================
# S3 Bucket for Frontend
# =====================

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}"

  tags = {
    Description = "Frontend hosting"
  }
}

locals {
  frontend_content_types = {
    ".css"  = "text/css; charset=utf-8"
    ".html" = "text/html; charset=utf-8"
    ".ico"  = "image/x-icon"
    ".js"   = "text/javascript; charset=utf-8"
    ".json" = "application/json"
    ".map"  = "application/json"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
  }
}

# Block public access settings
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  lifecycle {
    ignore_changes = [
      block_public_acls,
      block_public_policy,
      ignore_public_acls,
      restrict_public_buckets
    ]
  }
}

# Bucket policy for public read access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# Enable static website hosting
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Upload built frontend files
resource "aws_s3_object" "frontend_assets" {
  for_each = fileset("${path.module}/../frontend/dist", "**/*")

  bucket       = aws_s3_bucket.frontend.id
  key          = each.value
  source       = "${path.module}/../frontend/dist/${each.value}"
  content_type = lookup(local.frontend_content_types, lower(regex("\\.[^.]+$", each.value)), "application/octet-stream")
  etag         = filemd5("${path.module}/../frontend/dist/${each.value}")
  depends_on   = [aws_s3_bucket_policy.frontend]
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
