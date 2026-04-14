# Harish's Serverless E-Commerce Platform with Terraform

## Project Overview
A beginner-friendly, low-cost serverless e-commerce system built with AWS and Terraform.

**Naming Convention:** All resources follow `harish-tf-<resource-name>`

## Folder Structure
```
harish-terraform-project/
├── terraform/              # All Terraform config files
│   ├── provider.tf        # AWS provider setup
│   ├── variables.tf       # Input variables
│   ├── iam.tf            # IAM roles and policies
│   ├── lambda.tf         # Lambda function definitions
│   ├── dynamodb.tf       # DynamoDB table definitions
│   ├── apigateway.tf     # API Gateway setup
│   ├── s3.tf             # S3 bucket for frontend
│   ├── outputs.tf        # Output values
│   ├── terraform.tfvars  # Variable values
│   └── .gitignore        # Ignore sensitive files
├── backend/              # Python Lambda functions
│   ├── product/          # Product service code
│   ├── cart/             # Cart service code
│   └── order/            # Order service code
└── frontend/             # HTML/CSS/JS frontend
    └── index.html        # Main e-commerce page
```

## Implementation Steps

### Step 1: Provider + Variables ✅ DONE
- Configure AWS provider
- Define input variables
- Create terraform.tfvars

### Step 2: Product Lambda Service (NEXT)
- Create IAM role for Lambda
- Create Product Lambda function
- Zip Python code automatically with archive_file

### Step 3: DynamoDB Tables
- Create Product DynamoDB table (PAY_PER_REQUEST)
- Create Cart DynamoDB table
- Create Order DynamoDB table

### Step 4: API Gateway Setup
- Create HTTP API Gateway
- Create routes: /product, /cart, /order
- Integrate with Lambda functions

### Step 5: Cart & Order Services
- Build Cart Lambda service
- Build Order Lambda service
- Deploy to API Gateway

### Step 6: Frontend & S3
- Create simple HTML e-commerce page
- Upload to S3
- Enable public access

## How to Use

1. **Navigate to Terraform directory:**
   ```bash
   cd terraform
   ```

2. **Initialize Terraform:**
   ```bash
   terraform init
   ```

3. **Review changes:**
   ```bash
   terraform plan
   ```

4. **Deploy infrastructure:**
   ```bash
   terraform apply
   ```

5. **Get outputs:**
   ```bash
   terraform output
   ```

## Cost Optimization
- DynamoDB: PAY_PER_REQUEST (pay only for usage)
- Lambda: Free tier (1M requests/month)
- API Gateway: Free tier (1M requests/month)
- S3: Minimal storage cost (~$0.023/GB)

## Architecture
- **Frontend:** Static HTML in S3
- **API:** HTTP API Gateway (apigatewayv2)
- **Backend:** Python 3.12 Lambda functions
- **Database:** DynamoDB tables (one per service)
- **Authentication:** None (open API for simplicity)

## Next Steps
Ready to proceed to **Step 2: Product Lambda Service**?

Run `terraform plan` to validate Step 1 setup first!
