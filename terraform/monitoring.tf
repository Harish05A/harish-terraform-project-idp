# =====================
# Frontend synthetic monitoring and downtime alerts
# =====================

resource "aws_route53_health_check" "frontend_health_check" {
  failure_threshold             = 2
  request_interval              = 30
  resource_path                 = "/"
  fqdn = replace(
  aws_s3_bucket_website_configuration.frontend.website_endpoint,
  "http://",
  ""
)
  type                          = "HTTP"
  regions                       = ["ap-southeast-1", "ap-southeast-2", "ap-northeast-1"]
  port = 80

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

