import json
import pytest
from unittest.mock import MagicMock
import lambda_function as lf


# ------------------------
# TEST ADD TO CART SUCCESS
# ------------------------
def test_add_to_cart(monkeypatch):
    fake_carts = MagicMock()
    fake_products = MagicMock()

    # product exists
    fake_products.get_item.return_value = {
        "Item": {
            "product_id": "p1",
            "name": "Phone",
            "price": 1000
        }
    }

    # empty cart
    fake_carts.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "product_id": "p1",
            "quantity": 2
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['data']['total_items'] == 2

    fake_carts.put_item.assert_called_once()


# ------------------------
# TEST ADD TO CART PRODUCT NOT FOUND
# ------------------------
def test_add_to_cart_product_not_found(monkeypatch):
    fake_carts = MagicMock()
    fake_products = MagicMock()

    fake_products.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "user_id": "1",
            "product_id": "p1",
            "quantity": 1
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 404


# ------------------------
# TEST GET CART EMPTY
# ------------------------
def test_get_cart_empty(monkeypatch):
    fake_carts = MagicMock()
    fake_carts.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/cart/1"
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['total_items'] == 0


# ------------------------
# TEST UPDATE CART ITEM
# ------------------------
def test_update_cart_item(monkeypatch):
    fake_carts = MagicMock()
    fake_products = MagicMock()

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
            }
        }
    }

    fake_products.get_item.return_value = {
        "Item": {"product_id": "p1", "price": 1000}
    }

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "requestContext": {"http": {"method": "PUT"}},
        "rawPath": "/cart/1/p1",
        "body": json.dumps({"quantity": 3})
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_carts.put_item.assert_called_once()


# ------------------------
# TEST REMOVE FROM CART
# ------------------------
def test_remove_from_cart(monkeypatch):
    fake_carts = MagicMock()

    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "1",
            "items": {
                "p1": {
                    "product_name": "Phone",
                    "quantity": 1,
                    "total_price": 1000
                }
            }
        }
    }

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/cart/1/p1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_carts.put_item.assert_called_once()


# ------------------------
# TEST CLEAR CART
# ------------------------
def test_clear_cart(monkeypatch):
    fake_carts = MagicMock()

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/cart/1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_carts.delete_item.assert_called_once()