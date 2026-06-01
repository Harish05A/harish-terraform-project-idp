# E-Commerce Backend Deployment Summary

##  DEPLOYMENT SUCCESSFUL!

**Deployed on:** April 14, 2026
**Account:** 726101441380 (AWS Academy Developer)
**Region:** ap-southeast-1 (Singapore)
**Profile:** idp-sbx-trn-lab-01

---

##  API Endpoint

**Base URL:** https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/

Primary API routes now use `/v1/products`, `/v1/cart`, and `/v1/orders`. Legacy unversioned routes remain available for compatibility.

---

##  Deployed Resources

### Lambda Functions (3)
| Function | ARN | Status |
|----------|-----|--------|
| harish-tf-product | `arn:aws:lambda:ap-southeast-1:726101441380:function:harish-tf-product` |  Live |
| harish-tf-cart | `arn:aws:lambda:ap-southeast-1:726101441380:function:harish-tf-cart` |  Live |
| harish-tf-order | `arn:aws:lambda:ap-southeast-1:726101441380:function:harish-tf-order` |  Live |

### DynamoDB Tables (3)
| Table | Purpose | Status |
|-------|---------|--------|
| harish-tf-products | Product catalog |  Ready |
| harish-tf-carts | Shopping carts |  Ready |
| harish-tf-orders | Order history (with GSI) |  Ready |

### API Gateway
| Item | Value | Status |
|------|-------|--------|
| API Type | HTTP API |  Active |
| API ID | 490z9zcjr8 |  Ready |
| Auto-deploy | Enabled |  Active |

---

##  API Routes (Versioned)

### Product Service (5 routes)
```bash
GET    /v1/products              → List all products
POST   /v1/products              → Create product
PUT    /v1/products/{id}         → Update product
DELETE /v1/products/{id}         → Delete product
POST   /v1/products/{id}/review  → Submit review
```

### Cart Service (5 routes)
```bash
GET    /v1/cart/{user_id}                   → Get user's cart
POST   /v1/cart                             → Add item to cart
PUT    /v1/cart/{user_id}/{product_id}      → Update quantity
DELETE /v1/cart/{user_id}/{product_id}      → Remove item
DELETE /v1/cart/{user_id}                   → Clear cart
```

### Order Service (4 routes)
```bash
GET    /v1/orders/{order_id}                 → Get order details
GET    /v1/orders/user/{user_id}             → Get user's orders
POST   /v1/orders                            → Create order
DELETE /v1/orders/{order_id}                 → Cancel order
```

---

##  Test Your API

### 1. List Products
```bash
curl https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/products
```

### 2. Create a Product
```bash
curl -X POST https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-001",
    "name": "Laptop",
    "price": 999.99,
    "description": "High performance laptop",
    "stock": 50
  }'
```

### 3. Add to Cart
```bash
curl -X POST https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/cart \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "product_id": "prod-001",
    "quantity": 1
  }'
```

### 4. View Cart
```bash
curl https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/cart/user-123
```

### 5. Create Order
```bash
curl -X POST https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "shipping_address": "123 Main St, Singapore 123456",
    "email": "user@example.com",
    "payment_method": "CARD"
  }'
```

---

##  Cost Breakdown

### Monthly Costs (Estimated)
- **Lambda:** Free tier (~1M requests/month included)
- **DynamoDB (PAY_PER_REQUEST):** ~$0.25 - $2 (depends on usage)
- **API Gateway:** Free tier (~1M requests/month included)
- **Total:** < $3/month

### Free Tier Includes
- 1,000,000 Lambda requests/month
- 2.5M DynamoDB read units/month
- 1M DynamoDB write units/month
- 1M API Gateway requests/month
- 25 GB DynamoDB storage/month

---

## 📁 Terraform Files

All infrastructure as code:
```
terraform/
├── provider.tf           # AWS provider + SSO profile
├── variables.tf          # Input variables
├── iam.tf               # 3 Lambda roles + DynamoDB policies
├── lambda.tf            # 3 Lambda functions with auto-zipping
├── dynamodb.tf          # 3 DynamoDB tables with GSI
├── apigateway.tf        # HTTP API + 16 routes + integrations
├── outputs.tf           # All output values
├── terraform.tfvars     # Configuration values
└── .terraform.lock.hcl  # Locked provider versions
```

---

## 📊 Architecture Deployed

```
Frontend (Next: Step 6)
    ↓ HTTPS
API Gateway (490z9zcjr8)
    ├─ GET /v1/products → harish-tf-product → harish-tf-products table
    ├─ POST /v1/products
    ├─ PUT /v1/products/{id}
    ├─ DELETE /v1/products/{id}
    │
    ├─ GET /v1/cart/{user_id} → harish-tf-cart → harish-tf-carts + harish-tf-products
    ├─ POST /v1/cart
    ├─ PUT /v1/cart/{user_id}/{product_id}
    ├─ DELETE /v1/cart/{user_id}/{product_id}
    ├─ DELETE /v1/cart/{user_id}
    │
    ├─ GET /v1/orders/{order_id} → harish-tf-order → harish-tf-orders + harish-tf-carts
    ├─ GET /v1/orders/user/{user_id} (via GSI)
    ├─ POST /v1/orders
    └─ DELETE /v1/orders/{order_id}
```

---

##  What's Complete

-  Step 1: Provider + Variables
-  Step 2: Product Lambda Service
-  Step 3: DynamoDB Tables
-  Step 4: API Gateway
-  Step 5: Cart & Order Services
- ⏳ Step 6: S3 Frontend (NEXT)

---

## Next Steps

**Step 6: Frontend**
- Create simple HTML e-commerce page
- Product listing from API
- Shopping cart UI
- Checkout form
- Order history
- Upload to S3
- Enable public access

---

## 👤 Credentials

- **AWS Account:** 726101441380
- **Region:** ap-southeast-1
- **SSO Profile:** idp-sbx-trn-lab-01
- **User:** harish.a@idp.com
- **Role:** AWSReservedSSO_AWS-Academy-Developer_d6d0c9c82c7bf980

---

## 📝 Notes

- All resources follow naming convention: `harish-tf-<resource-name>`
- DynamoDB uses PAY_PER_REQUEST for cost optimization
- Auto-deploy enabled for API Gateway
- CloudWatch logging disabled (IAM permission limitation)
- All Lambda functions use Python 3.12 runtime
- Total of 37 AWS resources deployed

---

**Status:**  READY FOR FRONTEND STEP 6
