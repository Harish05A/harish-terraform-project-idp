import json
import pytest
from unittest.mock import MagicMock
import lambda_function as lf


# ------------------------
# TEST CREATE PRODUCT
# ------------------------
def test_create_product_success(monkeypatch):
    fake_table = MagicMock()

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "product_id": "1",
            "name": "Phone",
            "price": 1000,
            "description": "Smartphone"
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 201
    assert body['data']['name'] == "Phone"

    # verify DB call happened
    fake_table.put_item.assert_called_once()


# ------------------------
# TEST GET PRODUCTS
# ------------------------
def test_get_all_products(monkeypatch):
    fake_table = MagicMock()

    fake_table.scan.return_value = {
        "Items": [
            {
                "product_id": "1",
                "name": "Phone",
                "price": 1000,
                "description": "Smartphone"
            }
        ]
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "GET"}}
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['count'] == 1


# ------------------------
# TEST UPDATE PRODUCT
# ------------------------
def test_update_product(monkeypatch):
    fake_table = MagicMock()

    # simulate existing product
    fake_table.get_item.return_value = {
        "Item": {"product_id": "1"}
    }

    fake_table.update_item.return_value = {
        "Attributes": {
            "product_id": "1",
            "name": "New Phone"
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "PUT"}},
        "rawPath": "/product/1",
        "body": json.dumps({
            "name": "New Phone"
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_table.update_item.assert_called_once()


# ------------------------
# TEST DELETE PRODUCT
# ------------------------
def test_delete_product(monkeypatch):
    fake_table = MagicMock()

    fake_table.get_item.return_value = {
        "Item": {"product_id": "1"}
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/product/1"
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 200
    fake_table.delete_item.assert_called_once()


# ------------------------
# TEST MISSING FIELD
# ------------------------
def test_create_product_missing_field(monkeypatch):
    fake_table = MagicMock()

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({
            "product_id": "1"
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


# ------------------------
# TEST PRODUCT NOT FOUND
# ------------------------
def test_update_product_not_found(monkeypatch):
    fake_table = MagicMock()

    fake_table.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "PUT"}},
        "rawPath": "/product/999",
        "body": json.dumps({"name": "Test"})
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 404