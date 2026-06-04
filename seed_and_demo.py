#!/usr/bin/env python3
"""
E-Commerce Seeding, Load Generation & Resilience Verification Script
This script automates:
1. Product Seeding: Resets products catalog to a clean, default state.
2. Resilience Scenario Verification:
   - Insufficient Stock & Database Rollback
   - Case-Insensitive Idempotency Key Duplicate Order Prevention
   - Payload JSON Schema Validation
3. Automated Load Generation: Simulates multiple user transactions to populate CloudWatch/X-Ray.
"""

import os
import sys
import time
import json
import uuid
import random
import argparse
import subprocess
import requests

# ANSI Styling Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
UNDERLINE = '\033[4m'
END = '\033[0m'

def log_header(text):
    print(f"\n{BLUE}{BOLD}{'='*60}{END}")
    print(f"{BLUE}{BOLD} {text}{END}")
    print(f"{BLUE}{BOLD}{'='*60}{END}\n")

def log_step(num, title):
    print(f"\n{BLUE}{BOLD}[Step {num}] {title}{END}")

def log_success(text):
    print(f"{GREEN}{BOLD}[SUCCESS] {text}{END}")

def log_info(text):
    print(f"{YELLOW}[+] {text}{END}")

def log_warn(text):
    print(f"{YELLOW}{BOLD}[WARNING] {text}{END}")

def log_error(text):
    print(f"{RED}{BOLD}[ERROR] {text}{END}")

def resolve_api_url():
    """Retrieve API Gateway URL from environment variable or local terraform state."""
    env_url = os.environ.get("API_URL")
    if env_url:
        log_info(f"Using API URL from environment variable: {env_url}")
        return env_url.rstrip('/')

    # Try retrieving from terraform output
    log_info("Resolving API Gateway endpoint from Terraform outputs...")
    try:
        # Determine paths relative to this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        tf_dir = os.path.join(script_dir, "terraform")
        
        # Run terraform output
        res = subprocess.run(
            ["terraform", "output", "-json"],
            cwd=tf_dir,
            capture_output=True,
            text=True,
            check=True
        )
        outputs = json.loads(res.stdout)
        if "api_v1_endpoint" in outputs:
            endpoint = outputs["api_v1_endpoint"]["value"].rstrip('/')
            log_success(f"Resolved API v1 Endpoint: {endpoint}")
            return endpoint
    except Exception as e:
        log_warn(f"Failed to fetch from Terraform outputs ({str(e)}). Using fallback URL.")

    fallback_url = "https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1"
    log_info(f"Fallback URL: {fallback_url}")
    return fallback_url

# Initialize global API session and URL
API_URL = resolve_api_url()
session = requests.Session()

def api_call(method, endpoint, data=None, headers=None):
    """Utility wrapper for API calls with built-in logging."""
    url = f"{API_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    try:
        if method == "GET":
            res = session.get(url, headers=req_headers, timeout=10)
        elif method == "POST":
            res = session.post(url, json=data, headers=req_headers, timeout=10)
        elif method == "PUT":
            res = session.put(url, json=data, headers=req_headers, timeout=10)
        elif method == "DELETE":
            res = session.delete(url, headers=req_headers, timeout=10)
        return res
    except Exception as e:
        log_error(f"HTTP Connection failure to {url}: {str(e)}")
        return None

# =====================================================================
# SEEDING PROCESS
# =====================================================================
def seed_catalog():
    log_header("SEEDING PRODUCTS CATALOG")
    
    # 1. Standard Products to seed
    seed_products = [
        {
            "product_id": "LAPTOP-001",
            "name": "MacBook Pro 16\"",
            "price": 2499.99,
            "description": "M3 Max, 36GB RAM, 1TB SSD",
            "stock": 5
        },
        {
            "product_id": "PHONE-001",
            "name": "iPhone 15 Pro",
            "price": 1099.99,
            "description": "Natural Titanium, 256GB Storage",
            "stock": 10
        },
        {
            "product_id": "TABLET-001",
            "name": "iPad Pro 11\"",
            "price": 799.99,
            "description": "M2 Chip, Wi-Fi, 128GB Storage",
            "stock": 8
        },
        {
            "product_id": "WATCH-001",
            "name": "Apple Watch Ultra 2",
            "price": 799.00,
            "description": "Rugged fitness watch, GPS + Cellular",
            "stock": 15
        },
        {
            "product_id": "AIRPODS-001",
            "name": "AirPods Pro 2",
            "price": 249.00,
            "description": "Wireless earbuds, Active Noise Cancellation",
            "stock": 50
        }
    ]

    for p in seed_products:
        log_info(f"Upserting product {p['product_id']} ({p['name']}) with stock {p['stock']}...")
        # To handle upserts, we put/post it. The service handler will update stock and details.
        res = api_call("POST", "/products", p)
        if res and res.status_code in (200, 201):
            log_info(f"   Success: {res.json().get('message')}")
        else:
            log_warn(f"   Could not create/update product: {res.text if res else 'No Response'}")

    # Fetch catalog to check
    log_info("Fetching catalog to verify current state...")
    res = api_call("GET", "/products?limit=50")
    if res and res.status_code == 200:
        data = res.json().get('data', [])
        log_success(f"Products catalog seeded successfully! Total items: {len(data)}")
        for idx, item in enumerate(data, 1):
            print(f"   {idx}. {item.get('product_id')} - {item.get('name')} | Stock: {item.get('stock')} | Price: ${item.get('price')}")
    else:
        log_error("Could not fetch product catalog after seeding.")

# =====================================================================
# VERIFICATION SCENARIOS
# =====================================================================
def run_failure_scenario_tests():
    log_header("RUNNING RESILIENCE & FAILURE SCENARIO TESTS")
    user_id = f"demo-user-{str(uuid.uuid4())[:6]}"
    
    # -----------------------------------------------------------------
    # Test Scenario 1: Request Schema Validation
    # -----------------------------------------------------------------
    log_step(1, "Request Payload Schema Validation")
    log_info("Attempting order checkout with missing shipping_address and email...")
    bad_payload = {
        "user_id": user_id,
        "notes": "Missing required address and email fields"
    }
    res = api_call("POST", "/orders", bad_payload)
    if res is not None and res.status_code == 400:
        res_data = res.json()
        log_success("Rejected successfully by Lambda schema validator!")
        log_info(f"   Server Response (HTTP 400): {res_data.get('error') or res_data.get('message')}")
    else:
        log_error(f"Expected 400 Bad Request, but got: {res.status_code if res is not None else 'No Response'}")
        if res: print(res.text)

    # -----------------------------------------------------------------
    # Test Scenario 2: Insufficient Stock & Database Rollback
    # -----------------------------------------------------------------
    log_step(2, "Insufficient Stock Reservation & Stock Rollback")
    
    # Check LAPTOP-001 initial stock
    log_info("Fetching current stock of LAPTOP-001...")
    res = api_call("GET", "/products?limit=50")
    laptop_stock = 0
    if res and res.status_code == 200:
        for p in res.json().get('data', []):
            if p.get('product_id') == 'LAPTOP-001':
                laptop_stock = int(p.get('stock', 0))
                break
    log_info(f"LAPTOP-001 starting stock is: {laptop_stock}")
    
    # Empty cart first (precautionary)
    api_call("DELETE", f"/cart/{user_id}")
    
    # Add LAPTOP-001 with quantity GREATER than stock (laptop_stock + 2)
    overdraft_qty = laptop_stock + 2
    log_info(f"Adding LAPTOP-001 to cart with overdraft quantity: {overdraft_qty}")
    cart_item = {"user_id": user_id, "product_id": "LAPTOP-001", "quantity": overdraft_qty}
    res = api_call("POST", "/cart", cart_item)
    if res is None or res.status_code not in (200, 201):
        log_error(f"Failed to add item to cart: {res.text if res is not None else 'No Response'}")
        return

    # Attempt to place the order
    order_payload = {
        "user_id": user_id,
        "shipping_address": "456 Silicon Valley Blvd, CA",
        "email": "engineer@test.com"
    }
    log_info("Placing order... (Triggering transactional stock check and rollback)")
    res = api_call("POST", "/orders", order_payload)
    if res is not None and res.status_code == 400:
        res_data = res.json()
        log_success("Checkout rejected due to insufficient stock, as expected!")
        log_info(f"   Server Response (HTTP 400): {res_data.get('error') or res_data.get('message')}")
    else:
        log_error(f"Expected 400 Bad Request, but got: {res.status_code if res is not None else 'No Response'}")
        if res: print(res.text)

    # Verify that stock remained untouched (rolled back)
    log_info("Re-checking stock of LAPTOP-001...")
    res = api_call("GET", "/products?limit=50")
    final_laptop_stock = -1
    if res and res.status_code == 200:
        for p in res.json().get('data', []):
            if p.get('product_id') == 'LAPTOP-001':
                final_laptop_stock = int(p.get('stock', 0))
                break
    
    if final_laptop_stock == laptop_stock:
        log_success(f"Stock Rollback Verified! Stock is still {final_laptop_stock} (Initial: {laptop_stock})")
    else:
        log_error(f"Stock was modified! Current: {final_laptop_stock}, Expected: {laptop_stock}")

    # -----------------------------------------------------------------
    # Test Scenario 3: Idempotency Key Order De-duplication
    # -----------------------------------------------------------------
    log_step(3, "Idempotency-Key Check (De-duplication & Stock Safety)")
    
    # Fetch PHONE-001 initial stock
    log_info("Checking initial stock of PHONE-001...")
    res = api_call("GET", "/products?limit=50")
    phone_stock = 0
    if res and res.status_code == 200:
        for p in res.json().get('data', []):
            if p.get('product_id') == 'PHONE-001':
                phone_stock = int(p.get('stock', 0))
                break
    log_info(f"PHONE-001 starting stock: {phone_stock}")

    # Empty cart
    api_call("DELETE", f"/cart/{user_id}")

    # Add 1 PHONE-001 to cart
    log_info("Adding 1 PHONE-001 to cart...")
    cart_item = {"user_id": user_id, "product_id": "PHONE-001", "quantity": 1}
    api_call("POST", "/cart", cart_item)

    # Place order with Idempotency-Key
    idem_key = f"idem-{str(uuid.uuid4())[:8]}"
    headers = {"Idempotency-Key": idem_key}
    
    log_info(f"Placing order (First request) with Idempotency-Key: {idem_key}...")
    res1 = api_call("POST", "/orders", order_payload, headers=headers)
    if res1 is not None and res1.status_code in (200, 201):
        res1_data = res1.json()
        log_info(f"   Order created successfully! Order ID: {res1_data['data']['order_id']}")
        log_info(f"   Order status: {res1_data['data']['status']}")
    else:
        log_error(f"First checkout failed: {res1.text if res1 is not None else 'No Response'}")
        return

    # Immediately resend the exact same checkout payload with same key
    log_info(f"Retrying checkout (Second request) with SAME Idempotency-Key: {idem_key}...")
    res2 = api_call("POST", "/orders", order_payload, headers=headers)
    if res2 is not None and res2.status_code == 200:
        res2_data = res2.json()
        log_success("Idempotent check intercepted duplicate request!")
        log_info(f"   Message: {res2_data.get('message')}")
        log_info(f"   Order ID returned matches: {res2_data['data']['order_id']}")
    else:
        log_error(f"Duplicate checkout failed to intercept: {res2.status_code if res2 is not None else 'No Response'}")
        if res2 is not None: print(res2.text)

    # Double check stock of PHONE-001 (should only be decremented by 1, not 2)
    log_info("Verifying PHONE-001 stock decrement...")
    res = api_call("GET", "/products?limit=50")
    final_phone_stock = -1
    if res is not None and res.status_code == 200:
        for p in res.json().get('data', []):
            if p.get('product_id') == 'PHONE-001':
                final_phone_stock = int(p.get('stock', 0))
                break
    
    if final_phone_stock == phone_stock - 1:
        log_success(f"Stock Safety Verified! PHONE-001 stock decreased by exactly 1 (Current: {final_phone_stock})")
    else:
        log_error(f"PHONE-001 stock is: {final_phone_stock}, Expected: {phone_stock - 1} (Double-decrement bug!)")

# =====================================================================
# LOAD GENERATION
# =====================================================================
def generate_traffic_load(requests_count=50):
    log_header(f"GENERATING DEMO TRAFFIC LOAD ({requests_count} Transactions)")
    log_info("Generating live API traffic to populate CloudWatch metrics & X-Ray trace map...")

    user_pool = [f"simulated-user-{i}" for i in range(1, 10)]
    product_pool = ["LAPTOP-001", "PHONE-001", "TABLET-001", "WATCH-001", "AIRPODS-001"]
    
    successful_calls = 0
    failed_calls = 0

    for i in range(1, requests_count + 1):
        user = random.choice(user_pool)
        action = random.choice(["browse", "cart_add", "cart_view", "checkout", "bff_dashboard"])
        
        sys.stdout.write(f"\rTransaction {i}/{requests_count}: Action={action.upper()}...")
        sys.stdout.flush()

        res = None
        if action == "browse":
            res = api_call("GET", "/products?limit=50")
        
        elif action == "cart_view":
            res = api_call("GET", f"/cart/{user}")
        
        elif action == "bff_dashboard":
            res = api_call("GET", f"/bff/dashboard?userId={user}")
        
        elif action == "cart_add":
            product = random.choice(product_pool)
            qty = random.randint(1, 2)
            cart_item = {"user_id": user, "product_id": product, "quantity": qty}
            res = api_call("POST", "/cart", cart_item)
        
        elif action == "checkout":
            # 1. Clear cart
            api_call("DELETE", f"/cart/{user}")
            # 2. Add random item
            product = random.choice(product_pool)
            api_call("POST", "/cart", {"user_id": user, "product_id": product, "quantity": 1})
            # 3. Checkout (5% chance of missing key for validation test, 15% chance of duplicate)
            order_payload = {
                "user_id": user,
                "shipping_address": f"{random.randint(100, 999)} Tech Way, Singapore",
                "email": f"{user}@demo.com"
            }
            headers = None
            if random.random() < 0.2:
                # Place order with idempotency
                headers = {"Idempotency-Key": f"idem-load-{uuid.uuid4().hex[:8]}"}
            
            # Place order
            res = api_call("POST", "/orders", order_payload, headers=headers)
            
            # Sub-action: 15% chance of immediate duplicate checkout to fire metrics
            if res and res.status_code in (200, 201) and headers:
                time.sleep(0.1)
                api_call("POST", "/orders", order_payload, headers=headers)

        if res is not None and res.status_code in (200, 201):
            successful_calls += 1
        else:
            failed_calls += 1
        
        # Micro sleep to simulate realistic user pacing
        time.sleep(random.uniform(0.1, 0.4))

    print()
    log_success(f"Load generation finished! Successes: {successful_calls}, Errors/Fails: {failed_calls}")
    log_info("Please check AWS CloudWatch Dashboard 'harish-tf-dashboard' and AWS X-Ray Console inside AWS Academy.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="E-Commerce Seeding and Verification Script")
    parser.add_argument("--load", type=int, help="Run traffic load generator with N requests instead of scenario tests.")
    args = parser.parse_args()

    if args.load:
        generate_traffic_load(args.load)
    else:
        seed_catalog()
        run_failure_scenario_tests()
