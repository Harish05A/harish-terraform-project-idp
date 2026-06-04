# =====================================================
# CloudWatch Metric Alarms for E-Commerce Stack (Top 5 Alarms)
# =====================================================

# 1. Frontend Downtime Alert (Route53 Health Check)
resource "aws_cloudwatch_metric_alarm" "frontend_downtime" {
  alarm_name          = "${var.project_name}-frontend-downtime"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1 # 0 indicates unhealthy, 1 indicates healthy
  alarm_description   = "Triggered if Route53 health check reports the frontend is unhealthy."
  alarm_actions       = [aws_sns_topic.frontend_alerts.arn]
  ok_actions          = [aws_sns_topic.frontend_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.frontend_health_check.id
  }
}

# 2. High API Latency Alarm (> 2 sec average for 2 consecutive minutes)
resource "aws_cloudwatch_metric_alarm" "high_api_latency" {
  alarm_name          = "${var.project_name}-high-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 2000 # 2 seconds (in milliseconds)
  alarm_description   = "Triggered if average API latency exceeds 2 seconds for 2 consecutive minutes."
  alarm_actions       = [aws_sns_topic.frontend_alerts.arn]
  ok_actions          = [aws_sns_topic.frontend_alerts.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.product_api.id
  }
}

# 3. API 5XX Spikes Alarm (> 2 errors/minute)
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "Triggered if API Gateway returns more than 2 5XX responses in a minute."
  alarm_actions       = [aws_sns_topic.frontend_alerts.arn]
  ok_actions          = [aws_sns_topic.frontend_alerts.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.product_api.id
  }
}

# 4. Consolidated Lambda Errors Alarm (Sum across all 4 Lambdas > 5/min)
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_description   = "Triggered if total errors across all Lambda functions exceed 5 in a minute."
  alarm_actions       = [aws_sns_topic.frontend_alerts.arn]
  ok_actions          = [aws_sns_topic.frontend_alerts.arn]

  metric_query {
    id          = "total_errors"
    expression  = "m1 + m2 + m3 + m4"
    label       = "Total Lambda Errors"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 60
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.product.function_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 60
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.cart.function_name
      }
    }
  }

  metric_query {
    id = "m3"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 60
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.order.function_name
      }
    }
  }

  metric_query {
    id = "m4"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 60
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.monitor_lambda.function_name
      }
    }
  }
}

# 5. Consolidated DynamoDB Throttles Alarm (Sum across all 3 tables > 0)
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  alarm_description   = "Triggered if any DynamoDB table experiences read or write throttling."
  alarm_actions       = [aws_sns_topic.frontend_alerts.arn]
  ok_actions          = [aws_sns_topic.frontend_alerts.arn]

  metric_query {
    id          = "total_throttles"
    expression  = "p1 + p2 + c1 + c2 + o1 + o2"
    label       = "Total DynamoDB Throttles"
    return_data = true
  }

  metric_query {
    id = "p1"
    metric {
      metric_name = "ReadThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.products.name
      }
    }
  }

  metric_query {
    id = "p2"
    metric {
      metric_name = "WriteThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.products.name
      }
    }
  }

  metric_query {
    id = "c1"
    metric {
      metric_name = "ReadThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.carts.name
      }
    }
  }

  metric_query {
    id = "c2"
    metric {
      metric_name = "WriteThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.carts.name
      }
    }
  }

  metric_query {
    id = "o1"
    metric {
      metric_name = "ReadThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.orders.name
      }
    }
  }

  metric_query {
    id = "o2"
    metric {
      metric_name = "WriteThrottleEvents"
      namespace   = "AWS/DynamoDB"
      period      = 60
      stat        = "Sum"
      dimensions = {
        TableName = aws_dynamodb_table.orders.name
      }
    }
  }
}


# =====================================================
# CloudWatch Dashboard Definition
# =====================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # SECTION 1: EXECUTIVE OVERVIEW
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 2
        properties = {
          markdown = "## Executive Overview"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 4
        height = 4
        properties = {
          metrics = [
            [ "AWS/Route53", "HealthCheckStatus", "HealthCheckId", aws_route53_health_check.frontend_health_check.id ]
          ]
          view    = "singleValue"
          region  = "us-east-1"
          title   = "Frontend Availability (Route53)"
          period  = 60
          stat    = "Minimum"
        }
      },
      {
        type   = "metric"
        x      = 4
        y      = 2
        width  = 10
        height = 4
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.product_api.id, { "label": "Requests (Sum)", "stat": "Sum" } ],
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.product_api.id, { "label": "Avg Latency (ms)", "stat": "Average", "yAxis": "right" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "API Gateway Traffic & Performance"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 14
        y      = 2
        width  = 10
        height = 4
        properties = {
          metrics = [
            [ "AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global", { "label": "CDN Requests", "stat": "Sum" } ],
            [ "AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global", { "label": "CDN Error Rate (%)", "stat": "Average", "yAxis": "right" } ]
          ]
          view    = "timeSeries"
          region  = "us-east-1"
          title   = "CDN CloudFront Edge Traffic"
          period  = 60
        }
      },

      # SECTION 2: BUSINESS KPIS
      {
        type   = "text"
        x      = 0
        y      = 6
        width  = 24
        height = 2
        properties = {
          markdown = "## Business KPIs"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 8
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "ECommerceSystem", "SuccessfulOrders", { "stat": "Sum", "label": "Successful Orders", "color": "#2ca02c" } ],
            [ "ECommerceSystem", "FailedOrders", { "stat": "Sum", "label": "Failed Orders", "color": "#d62728" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "Order Status Trends"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 8
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "ECommerceSystem", "RevenueGenerated", { "stat": "Sum", "label": "Total Revenue ($)", "color": "#1f77b4" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "Revenue Generated"
          period  = 60
        }
      },

      # SECTION 3: API GATEWAY & CLOUDFRONT PERFORMANCE
      {
        type   = "text"
        x      = 0
        y      = 14
        width  = 24
        height = 2
        properties = {
          markdown = "## API Gateway & CDN Performance Details"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 16
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "p50", "label": "p50 Latency" } ],
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "p90", "label": "p90 Latency" } ],
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "p95", "label": "p95 Latency" } ],
            [ "AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "p99", "label": "p99 Latency" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "API Gateway Latency Percentiles"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 16
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/ApiGateway", "4XXError", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "Sum", "label": "4XX Errors", "color": "#f8b739" } ],
            [ "AWS/ApiGateway", "5XXError", "ApiId", aws_apigatewayv2_api.product_api.id, { "stat": "Sum", "label": "5XX Errors", "color": "#d13212" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "API Gateway Client vs Server Errors"
          period  = 60
        }
      },

      # SECTION 4: LAMBDA FUNCTIONS MONITORING
      {
        type   = "text"
        x      = 0
        y      = 22
        width  = 24
        height = 2
        properties = {
          markdown = "## Lambda Functions Monitoring"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.product.function_name, { "stat": "Sum", "label": "Product Invocations" } ],
            [ "AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.product.function_name, { "stat": "Sum", "label": "Product Errors", "color": "#d13212" } ],
            [ "AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.cart.function_name, { "stat": "Sum", "label": "Cart Invocations" } ],
            [ "AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.cart.function_name, { "stat": "Sum", "label": "Cart Errors", "color": "#ff4d4d" } ],
            [ "AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.order.function_name, { "stat": "Sum", "label": "Order Invocations" } ],
            [ "AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.order.function_name, { "stat": "Sum", "label": "Order Errors", "color": "#ff9999" } ],
            [ "AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.monitor_lambda.function_name, { "stat": "Sum", "label": "Monitor Invocations" } ],
            [ "AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.monitor_lambda.function_name, { "stat": "Sum", "label": "Monitor Errors", "color": "#ffcccc" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "Lambda Invocations & Errors (Sum)"
          period  = 60
          stacked = true
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.product.function_name, { "stat": "Average", "label": "Product Avg Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.product.function_name, { "stat": "Maximum", "label": "Product Max Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.cart.function_name, { "stat": "Average", "label": "Cart Avg Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.cart.function_name, { "stat": "Maximum", "label": "Cart Max Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.order.function_name, { "stat": "Average", "label": "Order Avg Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.order.function_name, { "stat": "Maximum", "label": "Order Max Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.monitor_lambda.function_name, { "stat": "Average", "label": "Monitor Avg Duration" } ],
            [ "AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.monitor_lambda.function_name, { "stat": "Maximum", "label": "Monitor Max Duration" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "Lambda Execution Durations (ms)"
          period  = 60
        }
      },

      # SECTION 5: DYNAMODB TABLE PERFORMANCE
      {
        type   = "text"
        x      = 0
        y      = 30
        width  = 24
        height = 2
        properties = {
          markdown = "## DynamoDB Table Performance"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 32
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.products.name, { "stat": "Sum", "label": "Products Read Capacity" } ],
            [ "AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.products.name, { "stat": "Sum", "label": "Products Write Capacity" } ],
            [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.carts.name, { "stat": "Sum", "label": "Carts Read Capacity" } ],
            [ "AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.carts.name, { "stat": "Sum", "label": "Carts Write Capacity" } ],
            [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.orders.name, { "stat": "Sum", "label": "Orders Read Capacity" } ],
            [ "AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.orders.name, { "stat": "Sum", "label": "Orders Write Capacity" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "DynamoDB Consumed Capacity Units"
          period  = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 32
        width  = 12
        height = 6
        properties = {
          metrics = [
            [ "AWS/DynamoDB", "ReadThrottleEvents", "TableName", aws_dynamodb_table.products.name, { "stat": "Sum", "label": "Products Read Throttles" } ],
            [ "AWS/DynamoDB", "WriteThrottleEvents", "TableName", aws_dynamodb_table.products.name, { "stat": "Sum", "label": "Products Write Throttles" } ],
            [ "AWS/DynamoDB", "ReadThrottleEvents", "TableName", aws_dynamodb_table.carts.name, { "stat": "Sum", "label": "Carts Read Throttles" } ],
            [ "AWS/DynamoDB", "WriteThrottleEvents", "TableName", aws_dynamodb_table.carts.name, { "stat": "Sum", "label": "Carts Write Throttles" } ],
            [ "AWS/DynamoDB", "ReadThrottleEvents", "TableName", aws_dynamodb_table.orders.name, { "stat": "Sum", "label": "Orders Read Throttles" } ],
            [ "AWS/DynamoDB", "WriteThrottleEvents", "TableName", aws_dynamodb_table.orders.name, { "stat": "Sum", "label": "Orders Write Throttles" } ]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "DynamoDB Throttling Events"
          period  = 60
        }
      },

      # SECTION 6: SYSTEM ALARMS & HEALTH ALERTS
      {
        type   = "text"
        x      = 0
        y      = 38
        width  = 24
        height = 2
        properties = {
          markdown = "## System Alarms & Health Alerts"
        }
      },
      {
        type   = "alarm"
        x      = 0
        y      = 40
        width  = 24
        height = 6
        properties = {
          title = "Active Infrastructure Alarms"
          alarms = [
            aws_cloudwatch_metric_alarm.frontend_downtime.arn,
            aws_cloudwatch_metric_alarm.high_api_latency.arn,
            aws_cloudwatch_metric_alarm.api_5xx_errors.arn,
            aws_cloudwatch_metric_alarm.lambda_errors.arn,
            aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
          ]
        }
      }
    ]
  })
}
