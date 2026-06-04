import os
import subprocess
import json
import requests
import pytest
import uuid

def get_api_url():
    """Retrieve API Gateway URL from env or local terraform state."""
    env_url = os.environ.get("API_URL")
    if env_url:
        return env_url.rstrip('/')

    # Try retrieving from terraform output
    try:
        # Run terraform output from the terraform folder
        tf_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "terraform"))
        res = subprocess.run(
            ["terraform", "output", "-json"],
            cwd=tf_dir,
            capture_output=True,
            text=True,
            check=True
        )
        outputs = json.loads(res.stdout)
        if "api_v1_endpoint" in outputs:
            return outputs["api_v1_endpoint"]["value"].rstrip('/')
    except Exception:
        pass

    # Fallback default from test_ecommerce.py or local mock
    return "https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com/v1"

API_URL = get_api_url()

@pytest.fixture(scope="module")
def api_session():
    session = requests.Session()
    return session

def test_full_integration_flow(api_session):
    # Unique product, cart, and user details to avoid conflicts
    unique_suffix = str(uuid.uuid4())[:8]
    user_id = f"user-{unique_suffix}"
    product_id = f"PROD-{unique_suffix}"
    
    # 1. Create a product via POST /products
    product_payload = {
        "product_id": product_id,
        "name": f"Integration Test Product {unique_suffix}",
        "price": 99.99,
        "description": "Created during full-stack integration test",
        "stock": 10
    }
    
    res = api_session.post(f"{API_URL}/products", json=product_payload, timeout=10)
    assert res.status_code in (200, 201), f"Failed to create product: {res.text}"
    
    # 2. Add product to cart via POST /cart
    cart_payload = {
        "user_id": user_id,
        "product_id": product_id,
        "quantity": 2
    }
    
    res = api_session.post(f"{API_URL}/cart", json=cart_payload, timeout=10)
    assert res.status_code in (200, 201), f"Failed to add item to cart: {res.text}"
    
    # 3. Retrieve cart via GET /cart/{user_id} and assert item is there
    res = api_session.get(f"{API_URL}/cart/{user_id}", timeout=10)
    assert res.status_code == 200, f"Failed to fetch cart: {res.text}"
    cart_data = res.json()["data"]
    assert cart_data["user_id"] == user_id
    assert product_id in cart_data["items"]
    assert int(cart_data["items"][product_id]["quantity"]) == 2
    
    # 4. Checkout via POST /orders using Idempotency-Key
    idempotency_key = f"key-{unique_suffix}"
    order_payload = {
        "user_id": user_id,
        "shipping_address": "123 Test Lane, Suite A",
        "email": f"test-{unique_suffix}@example.com"
    }
    
    headers = {"Idempotency-Key": idempotency_key}
    
    # First checkout call
    res1 = api_session.post(f"{API_URL}/orders", json=order_payload, headers=headers, timeout=10)
    assert res1.status_code in (200, 201), f"First checkout failed: {res1.text}"
    order_data1 = res1.json()
    order_id = order_data1["data"]["order_id"]
    assert order_id == idempotency_key
    assert order_data1["data"]["user_id"] == user_id
    assert order_data1["data"]["status"] == "CONFIRMED"
    
    # 5. Retry checkout with same Idempotency-Key
    res2 = api_session.post(f"{API_URL}/orders", json=order_payload, headers=headers, timeout=10)
    assert res2.status_code == 200, f"Second idempotent checkout failed: {res2.text}"
    order_data2 = res2.json()
    assert order_data2["data"]["order_id"] == order_id
    assert order_data2["data"]["user_id"] == user_id
    assert "retrieved successfully (idempotent)" in order_data2["message"]
    
    # 6. Fetch user orders via GET /orders/user/{user_id}
    res = api_session.get(f"{API_URL}/orders/user/{user_id}", timeout=10)
    assert res.status_code == 200, f"Failed to fetch user orders: {res.text}"
    user_orders = res.json()["data"]
    assert len(user_orders) == 1
    assert user_orders[0]["order_id"] == order_id
    
    # 7. Fetch the BFF Dashboard via GET /bff/dashboard
    res = api_session.get(f"{API_URL}/bff/dashboard?userId={user_id}", timeout=10)
    assert res.status_code == 200, f"Failed to fetch BFF dashboard: {res.text}"
    dashboard = res.json()
    assert "cart" in dashboard
    assert "recentOrders" in dashboard
    assert "recommendedProducts" in dashboard
    # The cart should have been cleared after checkout
    assert dashboard["cart"] == {} or dashboard["cart"].get("items") == {}
    # Recent orders should have the created order
    assert len(dashboard["recentOrders"]) >= 1
    assert dashboard["recentOrders"][0]["order_id"] == order_id
