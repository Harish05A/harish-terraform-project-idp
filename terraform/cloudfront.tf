# =====================
# CloudFront Distribution for Frontend
# =====================
# Serves the private S3 frontend bucket securely via HTTPS.
# Uses Origin Access Control (OAC) — the modern AWS-recommended
# replacement for OAI — so S3 public access can stay blocked.

# OAC grants CloudFront permission to sign requests to S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac"
  description                       = "OAC for ${var.project_name} frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name} frontend"
  price_class         = "PriceClass_All"

  # S3 REST origin — NOT the website endpoint.
  # OAC requires the REST (regional) domain, not the website hostname.
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Short TTL for HTML so deploys propagate quickly;
    # assets are cache-busted by Vite's content-hashed filenames.
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA fallback: any 403/404 from S3 (missing path) returns index.html
  # so that React Router client-side routes work on hard refresh/deep link.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # Default CloudFront HTTPS certificate (no custom domain needed)
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Wait for public access block to be set before creating the distribution
  depends_on = [aws_s3_bucket_public_access_block.frontend]

  tags = {
    Description = "CDN for ${var.project_name} frontend"
  }
}
