# =====================
# Frontend synthetic monitoring and downtime alerts
# =====================

resource "aws_route53_health_check" "frontend_health_check" {
  failure_threshold = 2
  request_interval  = 30
  resource_path     = "/"
  fqdn              = aws_cloudfront_distribution.frontend.domain_name
  type              = "HTTPS"
  regions           = ["ap-southeast-1", "ap-southeast-2", "ap-northeast-1"]
  port              = 443

  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_sns_topic" "frontend_alerts" {
  name = "${var.project_name}-frontend-alerts"
}

resource "aws_sns_topic_subscription" "email_alert" {
  # count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.frontend_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# =====================================================
# X-Ray Sampling Rule (Low Cost)
# =====================================================

resource "aws_xray_sampling_rule" "low_cost" {
  rule_name      = "low-cost-sampling"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.10

  host         = "*"
  http_method  = "*"
  url_path     = "*"
  service_name = "*"
  service_type = "*"
  resource_arn = "*"
}


