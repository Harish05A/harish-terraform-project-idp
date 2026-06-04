terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "idp-sbx-trn-lab-01" # AWS SSO Profile

  default_tags {
    tags = {}
  }
}

