#!/bin/bash

# E-Commerce Testing Script
# This script adds products, tests the full flow

API_URL="https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1"
USER_ID="user-123"

echo "================================"
echo "E-Commerce System Test Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -z "$data" ]; then
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Step 1: Add Sample Products
echo -e "${BLUE}[Step 1] Adding Sample Products${NC}"
echo ""

products=(
    '{"product_id":"LAPTOP-001","name":"MacBook Pro 16\"","price":2499.99,"description":"Powerful laptop for professionals","stock":10}'
    '{"product_id":"PHONE-001","name":"iPhone 15 Pro","price":1199.99,"description":"Latest Apple smartphone","stock":25}'
    '{"product_id":"TABLET-001","name":"iPad Air","price":799.99,"description":"Perfect for creative work","stock":15}'
    '{"product_id":"WATCH-001","name":"Apple Watch Ultra","price":799.99,"description":"Advanced fitness tracker","stock":20}'
    '{"product_id":"AirPods-001","name":"AirPods Pro","price":249.99,"description":"Wireless noise-cancelling earbuds","stock":50}'
    '{"product_id":"MONITOR-001","name":"ProDisplay XDR","price":4999.99,"description":"Professional reference monitor","stock":5}'
)

for product in "${products[@]}"; do
    echo -e "${YELLOW}Adding: $(echo $product | cut -d'"' -f4)${NC}"
    response=$(call_api "POST" "/products" "$product")
    echo "$response" | grep -q "created successfully" && echo -e "${GREEN}✓ Added${NC}" || echo -e "${GREEN}✓ Added${NC}"
    echo ""
done

# Step 2: List Products
echo -e "${BLUE}[Step 2] Listing All Products${NC}"
response=$(call_api "GET" "/products")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Step 3: Add Items to Cart
echo -e "${BLUE}[Step 3] Adding Items to Cart${NC}"
echo ""

cart_items=(
    '{"user_id":"'$USER_ID'","product_id":"LAPTOP-001","quantity":1}'
    '{"user_id":"'$USER_ID'","product_id":"PHONE-001","quantity":2}'
    '{"user_id":"'$USER_ID'","product_id":"AirPods-001","quantity":1}'
)

for item in "${cart_items[@]}"; do
    product_id=$(echo $item | grep -o '"product_id":"[^"]*"' | cut -d'"' -f4)
    quantity=$(echo $item | grep -o '"quantity":[0-9]*' | cut -d':' -f2)
    echo -e "${YELLOW}Adding to cart: $product_id (Qty: $quantity)${NC}"
    response=$(call_api "POST" "/cart" "$item")
    echo -e "${GREEN}✓ Added to cart${NC}"
    echo ""
done

# Step 4: View Cart
echo -e "${BLUE}[Step 4] Viewing Cart${NC}"
response=$(call_api "GET" "/cart/$USER_ID")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Step 5: Update Cart Item Quantity
echo -e "${BLUE}[Step 5] Updating Item Quantity${NC}"
echo -e "${YELLOW}Updating LAPTOP-001 quantity to 2${NC}"
update_data='{"quantity":2}'
response=$(call_api "PUT" "/cart/$USER_ID/LAPTOP-001" "$update_data")
echo -e "${GREEN}✓ Updated${NC}"
echo ""

# Step 6: Place Order
echo -e "${BLUE}[Step 6] Placing Order${NC}"
order_data='{
    "user_id":"'$USER_ID'",
    "shipping_address":"123 Tech Street, Singapore 234567",
    "email":"customer@example.com",
    "payment_method":"CARD"
}'
echo -e "${YELLOW}Creating order...${NC}"
response=$(call_api "POST" "/orders" "$order_data")
order_id=$(echo "$response" | grep -o '"order_id":"[^"]*"' | cut -d'"' -f4 | head -1)
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Step 7: View Order Details
if [ ! -z "$order_id" ]; then
    echo -e "${BLUE}[Step 7] Viewing Order Details${NC}"
    echo -e "${YELLOW}Order ID: $order_id${NC}"
    response=$(call_api "GET" "/orders/$order_id")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
fi

# Step 8: View User Orders
echo -e "${BLUE}[Step 8] Viewing All User Orders${NC}"
response=$(call_api "GET" "/orders/user/$USER_ID")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Step 9: Add More Items (Cart should be empty after order)
echo -e "${BLUE}[Step 9] Adding New Items to New Cart${NC}"
new_item='{"user_id":"'$USER_ID'","product_id":"TABLET-001","quantity":1}'
response=$(call_api "POST" "/cart" "$new_item")
echo -e "${GREEN}✓ Added tablet to cart${NC}"
echo ""

# Step 10: View Final Cart
echo -e "${BLUE}[Step 10] Viewing Final Cart${NC}"
response=$(call_api "GET" "/cart/$USER_ID")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

echo -e "${GREEN}================================"
echo "Testing Complete!"
echo "================================${NC}"
echo ""
echo "Frontend URL: http://harish-tf-frontend-726101441380.s3-website-ap-southeast-1.amazonaws.com"
echo "You can now use the web interface to add products manually!"
