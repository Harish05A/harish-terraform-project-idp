#!/usr/bin/env python3
"""
E-Commerce System Test Script
Tests all functionality: products, cart, orders
"""

import requests
import json
import sys
from datetime import datetime

API_URL = "https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com"
USER_ID = "user-123"

# ANSI Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
END = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*50}{END}")
    print(f"{BLUE}{text}{END}")
    print(f"{BLUE}{'='*50}{END}\n")

def print_step(num, text):
    print(f"\n{BLUE}[Step {num}] {text}{END}\n")

def print_success(text):
    print(f"{GREEN}[OK] {text}{END}")

def print_info(text):
    print(f"{YELLOW}[+] {text}{END}")

def api_call(method, endpoint, data=None):
    """Make API call and return JSON response"""
    headers = {"Content-Type": "application/json"}
    url = f"{API_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)

        # Print full response on error
        if response.status_code >= 400:
            print(f"{RED}Error {response.status_code}: {response.text}{END}")
            return None

        return response.json()
    except Exception as e:
        print(f"{RED}Error: {str(e)}{END}")
        return None

def main():
    print_header("E-Commerce System Test")
    print(f"API URL: {API_URL}\n")
    print(f"User ID: {USER_ID}\n")

    # Sample products
    products = [
        {
            "product_id": "LAPTOP-001",
            "name": "MacBook Pro 16\"",
            "price": 2499.99,
            "description": "Powerful laptop for professionals",
            "stock": 10
        },
        {
            "product_id": "PHONE-001",
            "name": "iPhone 15 Pro",
            "price": 1199.99,
            "description": "Latest Apple smartphone",
            "stock": 25
        },
        {
            "product_id": "TABLET-001",
            "name": "iPad Air",
            "price": 799.99,
            "description": "Perfect for creative work",
            "stock": 15
        },
        {
            "product_id": "WATCH-001",
            "name": "Apple Watch Ultra",
            "price": 799.99,
            "description": "Advanced fitness tracker",
            "stock": 20
        },
        {
            "product_id": "AIRPODS-001",
            "name": "AirPods Pro",
            "price": 249.99,
            "description": "Wireless noise-cancelling earbuds",
            "stock": 50
        },
        {
            "product_id": "MONITOR-001",
            "name": "ProDisplay XDR",
            "price": 4999.99,
            "description": "Professional reference monitor",
            "stock": 5
        }
    ]

    # Step 1: Add Products
    print_step(1, "Adding Sample Products")
    added_products = []
    for product in products:
        print_info(f"Adding: {product['name']}")
        response = api_call("POST", "/product", product)
        if response:
            added_products.append(product)
            print_success(f"Added {product['name']}")

    # Step 2: List Products
    print_step(2, "Listing All Products")
    response = api_call("GET", "/product")
    if response:
        print(json.dumps(response, indent=2))
        product_count = len(response.get('data', []))
        print_success(f"Retrieved {product_count} products")

    # Step 3: Add Items to Cart
    print_step(3, "Adding Items to Cart")
    cart_items = [
        {"user_id": USER_ID, "product_id": "LAPTOP-001", "quantity": 1},
        {"user_id": USER_ID, "product_id": "PHONE-001", "quantity": 2},
        {"user_id": USER_ID, "product_id": "AIRPODS-001", "quantity": 1}
    ]

    for item in cart_items:
        print_info(f"Adding to cart: {item['product_id']} (Qty: {item['quantity']})")
        response = api_call("POST", "/cart", item)
        if response:
            print_success(f"Added {item['product_id']} to cart")

    # Step 4: View Cart
    print_step(4, "Viewing Cart")
    response = api_call("GET", f"/cart/{USER_ID}")
    if response:
        print(json.dumps(response, indent=2))
        if 'data' in response:
            print_success(f"Cart has {response['data'].get('total_items', 0)} items, Total: ${response['data'].get('total_price', 0):.2f}")

    # Step 5: Update Cart Item Quantity
    print_step(5, "Updating Item Quantity")
    print_info("Updating LAPTOP-001 quantity to 2")
    update_data = {"quantity": 2}
    response = api_call("PUT", f"/cart/{USER_ID}/LAPTOP-001", update_data)
    if response:
        print_success("Updated quantity")

    # Step 6: Place Order
    print_step(6, "Placing Order")
    order_data = {
        "user_id": USER_ID,
        "shipping_address": "123 Tech Street, Singapore 234567",
        "email": "customer@example.com",
        "payment_method": "CARD"
    }
    print_info("Creating order...")
    response = api_call("POST", "/order", order_data)
    order_id = None
    if response:
        print(json.dumps(response, indent=2))
        if 'data' in response:
            order_id = response['data'].get('order_id')
            print_success(f"Order created! Order ID: {order_id}")

    # Step 7: View Order Details
    if order_id:
        print_step(7, "Viewing Order Details")
        response = api_call("GET", f"/order/{order_id}")
        if response:
            print(json.dumps(response, indent=2))
            print_success("Order retrieved")

    # Step 8: View User Orders
    print_step(8, "Viewing All User Orders")
    response = api_call("GET", f"/order/user/{USER_ID}")
    if response:
        print(json.dumps(response, indent=2))
        order_count = len(response.get('data', []))
        print_success(f"Retrieved {order_count} orders")

    # Step 9: Add More Items (New cart)
    print_step(9, "Adding New Items to Cart")
    new_item = {"user_id": USER_ID, "product_id": "TABLET-001", "quantity": 1}
    response = api_call("POST", "/cart", new_item)
    if response:
        print_success("Added tablet to cart")

    # Step 10: View Final Cart
    print_step(10, "Viewing Final Cart")
    response = api_call("GET", f"/cart/{USER_ID}")
    if response:
        print(json.dumps(response, indent=2))

    # Summary
    print_header("Testing Complete!")
    print(f"\n{GREEN}All operations completed successfully!{END}\n")
    print(f"Frontend URL: {YELLOW}http://harish-tf-frontend-726101441380.s3-website-ap-southeast-1.amazonaws.com{END}\n")
    print("You can now:")
    print("  1. Visit the frontend URL above")
    print("  2. Browse products (we just added 6 sample products)")
    print("  3. Add items to your cart")
    print("  4. Proceed to checkout")
    print("  5. Place orders")
    print("  6. View your order history")
    print("")

if __name__ == "__main__":
    main()
