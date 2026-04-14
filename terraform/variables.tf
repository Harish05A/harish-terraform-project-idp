variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name (used in all resource names)"
  type        = string
  default     = "harish-tf"
}

variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
  default     = "dev"
}

variable "python_runtime" {
  description = "Python runtime for Lambda functions"
  type        = string
  default     = "python3.12"
}
