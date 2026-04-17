# Serverless E-Commerce Platform with Terraform

## Project Overview
This project is a simple serverless e-commerce application built with AWS and Terraform.

It includes:
- Terraform infrastructure setup
- Python Lambda functions for product, cart, order, and monitoring flows
- DynamoDB tables for products, carts, and orders
- HTTP API Gateway routes
- Static frontend hosted on S3
- Basic frontend availability monitoring with Route 53 health check and SNS alerts

## What I Have Done
- Configured the AWS provider, variables, and Terraform project structure
- Created IAM roles and policies for Lambda execution and DynamoDB access
- Built 3 main backend services using Python Lambda:
  - Product service for create, list, update, and delete
  - Cart service for add, view, update, remove, and clear cart
  - Order service for create, fetch, list by user, and cancel order
- Added a monitoring Lambda that sends an SNS alert if the frontend is not reachable
- Created DynamoDB tables for products, carts, and orders
- Added an order table secondary index for querying orders by user
- Configured HTTP API Gateway with routes for product, cart, and order operations
- Added Lambda permissions for API Gateway invocation
- Created an S3 bucket for static website hosting
- Uploaded the frontend application through Terraform
- Added Route 53 health check and SNS topic/subscription for frontend alerts
- Defined Terraform outputs for API URL, frontend URL, table names, and Lambda details
- Added unit test files for the product, cart, and order Lambda functions

## Services Implemented

### Backend
- `product` Lambda
- `cart` Lambda
- `order` Lambda
- `monitoring` Lambda

### Database
- `harish-tf-products`
- `harish-tf-carts`
- `harish-tf-orders`

### API Routes
- `GET /product`
- `POST /product`
- `PUT /product/{id}`
- `DELETE /product/{id}`
- `GET /cart/{user_id}`
- `POST /cart`
- `PUT /cart/{user_id}/{product_id}`
- `DELETE /cart/{user_id}/{product_id}`
- `DELETE /cart/{user_id}`
- `GET /order/{order_id}`
- `GET /order/user/{user_id}`
- `POST /order`
- `DELETE /order/{order_id}`

## Frontend
The frontend is a static HTML application hosted on S3.

It includes:
- Product listing
- Add product form
- Cart view
- Checkout form
- Order history view

## Project Structure
```text
harish-terraform-project/
|-- terraform/   # Infrastructure code
|-- backend/     # Lambda functions and tests
|-- frontend/    # Static frontend
|-- QUICK_START.md
|-- SYSTEM_GUIDE.md
`-- DEPLOYMENT_SUMMARY.md
```

## How to Run
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Links
- ApiGateway URL - "https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/"
- Frontend URL - "http://harish-tf-frontend-726101441380.s3-website-ap-southeast-1.amazonaws.com"

## Notes
- AWS region is set to `ap-southeast-1`
- Python runtime is `python3.14`
- Resource naming uses the `harish-tf` prefix
- Unit test files are present in the backend folders
- I could not run `pytest` in this environment because `pytest` is not installed
