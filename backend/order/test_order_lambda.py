import json
import pytest
from unittest.mock import MagicMock
import lambda_function as lf


# ------------------------
# TEST CREATE ORDER SUCCESS
# ------------------------
def test_create_order_success(monkeypatch):
    fake_orders = MagicMock()
    fake_carts = MagicMock()

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
