# Quick Start Guide

## 🌐 Access the System

### Frontend (Web UI)
```
http://harish-tf-frontend-726101441380.s3-website-ap-southeast-1.amazonaws.com
```

### API Endpoint
```
https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com
```

---

## 📱 Using the Frontend

1. **Browse Products** - See all 6 pre-loaded products
2. **Add to Cart** - Click "Add to Cart" button
3. **View Cart** - Tab → Shopping Cart
4. **Checkout** - Fill form & click "Place Order"
5. **View Orders** - Tab → Order History

---

## 🔗 API Quick Commands

### List All Products
```bash
curl https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/product
```

### Get User's Cart
```bash
curl https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/cart/user-123
```

### Get User's Orders
```bash
curl https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/order/user/user-123
```

---

## 🧪 Run Tests

```bash
# From project directory
cd c:/Users/harish.a/harish-terraform-project

# Run Python test (recommended)
python3 test_ecommerce.py

# Runs: Add products → Add to cart → Checkout → View orders
```

---

## 📊 View Data in AWS

### Products Table
```bash
aws dynamodb scan --table-name harish-tf-products \
  --profile idp-sbx-trn-lab-01 --region ap-southeast-1
```

### Check Lambda Logs
```bash
# Product Lambda
aws logs tail /aws/lambda/harish-tf-product --follow --profile idp-sbx-trn-lab-01

# Cart Lambda
aws logs tail /aws/lambda/harish-tf-cart --follow --profile idp-sbx-trn-lab-01

# Order Lambda
aws logs tail /aws/lambda/harish-tf-order --follow --profile idp-sbx-trn-lab-01
```

---

## 🔑 Sample User ID
```
user-123
```
(Already has sample data; use different ID for clean testing)

---

## 📋 Pre-loaded Products

| Product ID | Name | Price | Stock |
|-----------|------|-------|-------|
| LAPTOP-001 | MacBook Pro 16" | $2,499.99 | 10 |
| PHONE-001 | iPhone 15 Pro | $1,199.99 | 25 |
| TABLET-001 | iPad Air | $799.99 | 15 |
| WATCH-001 | Apple Watch Ultra | $799.99 | 20 |
| AIRPODS-001 | AirPods Pro | $249.99 | 50 |
| MONITOR-001 | ProDisplay XDR | $4,999.99 | 5 |

---

## 💰 Cost Per Month
**~$0-5 USD** (mostly free tier)

---

## 📂 File Locations

| Name | Path |
|------|------|
| Frontend | frontend/index.html |
| Product Lambda | backend/product/lambda_function.py |
| Cart Lambda | backend/cart/lambda_function.py |
| Order Lambda | backend/order/lambda_function.py |
| Terraform Config | terraform/*.tf |
| Documentation | SYSTEM_GUIDE.md |

---

## ✨ Fully Functional Components

✅ Frontend (S3 hosted)  
✅ Product Service  
✅ Cart Service  
✅ Order Service  
✅ DynamoDB Tables  
✅ API Gateway  
✅ Sample Data  

---

**Ready to use! No additional setup required.**
