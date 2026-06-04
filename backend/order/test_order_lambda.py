import json
import pytest
from unittest.mock import MagicMock
import lambda_function as lf

@pytest.fixture(autouse=True)
def mock_publish_metric(monkeypatch):
    monkeypatch.setattr(lf, "publish_metric", MagicMock())



# ------------------------
# TEST CREATE ORDER SUCCESS
# ------------------------
def test_create_order_success(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()
    fake_products = MagicMock()

    # mock cart data
    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "1",
            "items": {
                "p1": {
                    "product_id": "p1",
                    "product_name": "Phone",
                    "unit_price": 1000,
                    "quantity": 1,
                    "total_price": 1000
                }
            },
            "total_items": 1,
            "total_price": 1000
        }
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 201
    assert body['data']['user_id'] == "1"

    fake_orders.put_item.assert_called_once()
    fake_carts.delete_item.assert_called_once()


def test_create_order_accepts_legacy_list_cart_items(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()

    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "1",
            "items": [
                {
                    "product_id": "p1",
                    "product": "Phone",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "total_items": 1,
            "total_price": 1000
        }
    }

    fake_products = MagicMock()
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 201
    assert body['data']['items']['p1']['product_name'] == "Phone"


# ------------------------
# TEST CREATE ORDER EMPTY CART
# ------------------------
def test_create_order_empty_cart(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()

    fake_carts.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


# ------------------------
# TEST GET ORDER SUCCESS
# ------------------------
def test_get_order(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.get_item.return_value = {
        "Item": {"order_id": "123", "status": "CONFIRMED"}
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/123"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200


# ------------------------
# TEST GET ORDER NOT FOUND
# ------------------------
def test_get_order_not_found(monkeypatch):
    fake_orders = MagicMock()
    fake_orders.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/999"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 404


# ------------------------
# TEST GET USER ORDERS
# ------------------------
def test_get_user_orders(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.scan.return_value = {
        "Items": [
            {"order_id": "1", "created_at": "2024-01-01"},
            {"order_id": "2", "created_at": "2024-01-02"}
        ]
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/user/1"
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['count'] == 2


# ------------------------
# TEST CANCEL ORDER SUCCESS
# ------------------------
def test_cancel_order(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.get_item.return_value = {
        "Item": {"order_id": "1", "status": "CONFIRMED"}
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/order/1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_orders.put_item.assert_called_once()


# ------------------------
# TEST CREATE ORDER EMPTY CART
# ------------------------
def test_create_order_empty_cart(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()

    fake_carts.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


# ------------------------
# TEST GET ORDER SUCCESS
# ------------------------
def test_get_order(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.get_item.return_value = {
        "Item": {"order_id": "123", "status": "CONFIRMED"}
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/123"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200


# ------------------------
# TEST GET ORDER NOT FOUND
# ------------------------
def test_get_order_not_found(monkeypatch):
    fake_orders = MagicMock()
    fake_orders.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/999"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 404


# ------------------------
# TEST GET USER ORDERS
# ------------------------
def test_get_user_orders(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.scan.return_value = {
        "Items": [
            {"order_id": "1", "created_at": "2024-01-01"},
            {"order_id": "2", "created_at": "2024-01-02"}
        ]
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/order/user/1"
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['count'] == 2


# ------------------------
# TEST CANCEL ORDER SUCCESS
# ------------------------
def test_cancel_order(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.get_item.return_value = {
        "Item": {"order_id": "1", "status": "CONFIRMED"}
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/order/1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_orders.put_item.assert_called_once()


# ------------------------
# TEST CANCEL ORDER INVALID STATUS
# ------------------------
def test_cancel_order_invalid_status(monkeypatch):
    fake_orders = MagicMock()

    fake_orders.get_item.return_value = {
        "Item": {"order_id": "1", "status": "DELIVERED"}
    }

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/order/1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


# ------------------------
# TEST STOCK RESERVATION / ROLLBACK
# ------------------------
from botocore.exceptions import ClientError

def test_create_order_insufficient_stock_rollback(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()
    fake_products = MagicMock()

    # Cart has two items: p1 (quantity 1) and p2 (quantity 2)
    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "1",
            "items": {
                "p1": {
                    "product_id": "p1",
                    "product_name": "Phone",
                    "unit_price": 1000,
                    "quantity": 1,
                    "total_price": 1000
                },
                "p2": {
                    "product_id": "p2",
                    "product_name": "Case",
                    "unit_price": 50,
                    "quantity": 2,
                    "total_price": 100
                }
            },
            "total_items": 3,
            "total_price": 1100
        }
    }

    # Simulate stock reservation success for p1, but failure for p2
    def update_item_mock(Key, UpdateExpression, ConditionExpression=None, ExpressionAttributeValues=None):
        if Key['product_id'] == 'p2':
            # Throw ConditionalCheckFailedException
            error_response = {
                'Error': {
                    'Code': 'ConditionalCheckFailedException',
                    'Message': 'The conditional request failed'
                }
            }
            raise ClientError(error_response, 'UpdateItem')
        return {}

    fake_products.update_item.side_effect = update_item_mock

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 400
    assert "Insufficient stock" in body['error']

    # Order table put_item should NOT be called
    fake_orders.put_item.assert_not_called()
    # Cart table delete_item should NOT be called
    fake_carts.delete_item.assert_not_called()

    # Product update_item should have been called:
    # 1. Decrement p1
    # 2. Try to decrement p2 (failed)
    # 3. Rollback p1 (increment back)
    # Total calls: 3
    assert fake_products.update_item.call_count == 3
    
    # Verify the calls
    calls = fake_products.update_item.call_args_list
    # First call: decrement p1
    assert calls[0][1]['Key'] == {'product_id': 'p1'}
    assert "stock - :qty" in calls[0][1]['UpdateExpression']
    assert calls[0][1]['ExpressionAttributeValues'] == {':qty': 1}
    # Second call: decrement p2
    assert calls[1][1]['Key'] == {'product_id': 'p2'}
    assert "stock - :qty" in calls[1][1]['UpdateExpression']
    assert calls[1][1]['ExpressionAttributeValues'] == {':qty': 2}
    # Third call: rollback p1
    assert calls[2][1]['Key'] == {'product_id': 'p1'}
    assert "stock + :qty" in calls[2][1]['UpdateExpression']
    assert calls[2][1]['ExpressionAttributeValues'] == {':qty': 1}


def test_create_order_save_failure_rollback(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()
    fake_products = MagicMock()

    # Cart has one item: p1 (quantity 1)
    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "1",
            "items": {
                "p1": {
                    "product_id": "p1",
                    "product_name": "Phone",
                    "unit_price": 1000,
                    "quantity": 1,
                    "total_price": 1000
                }
            },
            "total_items": 1,
            "total_price": 1000
        }
    }

    # Simulate orders table save failure
    fake_orders.put_item.side_effect = Exception("DB Connection Timeout")

    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "shipping_address": "Chennai",
            "email": "test@mail.com"
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 500
    assert "DB Connection Timeout" in body['error']

    # Cart table delete_item should NOT be called
    fake_carts.delete_item.assert_not_called()

    # Product update_item should have been called:
    # 1. Decrement p1
    # 2. Rollback p1 (increment back) after orders table failure
    assert fake_products.update_item.call_count == 2
    
    calls = fake_products.update_item.call_args_list
    # First call: decrement p1
    assert calls[0][1]['Key'] == {'product_id': 'p1'}
    assert "stock - :qty" in calls[0][1]['UpdateExpression']
    # Second call: rollback p1
    assert calls[1][1]['Key'] == {'product_id': 'p1'}
    assert "stock + :qty" in calls[1][1]['UpdateExpression']
