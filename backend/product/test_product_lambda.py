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
    assert body['data']['rating_average'] == 0
    assert body['data']['rating_count'] == 0
    assert body['data']['rating_total'] == 0
    assert body['data']['rating'] == 0

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
                "description": "Smartphone",
                "rating_average": 4.5,
                "rating_count": 2,
                "rating_total": 9
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
    assert body['data'][0]['rating_average'] == 4.5
    assert body['data'][0]['rating_count'] == 2
    assert body['data'][0]['rating_total'] == 9
    assert body['items'][0]['product_id'] == "1"
    assert body['lastKey'] is None
    fake_table.scan.assert_called_once_with(Limit=10)


def test_get_all_products_with_pagination(monkeypatch):
    fake_table = MagicMock()

    fake_table.scan.return_value = {
        "Items": [
            {
                "product_id": "2",
                "name": "Laptop",
                "price": 1500,
                "description": "Portable computer"
            }
        ],
        "LastEvaluatedKey": {"product_id": "2"}
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/v1/products",
        "queryStringParameters": {
            "limit": "5",
            "lastKey": json.dumps({"product_id": "1"})
        }
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['items'][0]['product_id'] == "2"
    assert body['lastKey'] == {"product_id": "2"}
    fake_table.scan.assert_called_once_with(
        Limit=5,
        ExclusiveStartKey={"product_id": "1"}
    )


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
            "name": "New Phone",
            "rating_average": 5,
            "rating_count": 3,
            "rating_total": 15,
            "rating": 5
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)

    event = {
        "requestContext": {"http": {"method": "PUT"}},
        "rawPath": "/product/1",
        "body": json.dumps({
            "name": "New Phone",
            "rating_average": 5,
            "rating_count": 3,
            "rating_total": 15
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['data']['rating_average'] == 5
    assert body['data']['rating_count'] == 3
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


# ------------------------
# TEST SUBMIT REVIEW
# ------------------------
def test_submit_review_success(monkeypatch):
    fake_product_table = MagicMock()
    fake_orders_table = MagicMock()

    fake_product_table.get_item.return_value = {
        "Item": {
            "product_id": "1",
            "rating_total": 8,
            "rating_count": 2
        }
    }

    fake_product_table.update_item.return_value = {
        "Attributes": {
            "product_id": "1",
            "rating_total": 13,
            "rating_count": 3,
            "rating_average": 13 / 3,
            "rating": 13 / 3
        }
    }

    fake_orders_table.get_item.return_value = {
        "Item": {
            "order_id": "order-123",
            "user_id": "user-123",
            "items": {
                "1": {
                    "product_id": "1",
                    "product_name": "Phone",
                    "quantity": 1
                }
            },
            "reviewed_products": []
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_product_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/v1/products/1/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 5
        })
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['data']['rating_count'] == 3
    assert round(body['data']['rating_average'], 2) == 4.33
    fake_product_table.update_item.assert_called_once()
    fake_orders_table.put_item.assert_called_once()


def test_submit_review_invalid_rating(monkeypatch):
    fake_table = MagicMock()
    fake_orders_table = MagicMock()

    monkeypatch.setattr(lf, "get_table", lambda: fake_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/product/1/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 6
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


def test_submit_review_product_not_found(monkeypatch):
    fake_product_table = MagicMock()
    fake_orders_table = MagicMock()

    fake_orders_table.get_item.return_value = {
        "Item": {
            "order_id": "order-123",
            "user_id": "user-123",
            "items": {
                "999": {
                    "product_id": "999",
                    "product_name": "Ghost Product",
                    "quantity": 1
                }
            },
            "reviewed_products": []
        }
    }
    fake_product_table.get_item.return_value = {}

    monkeypatch.setattr(lf, "get_table", lambda: fake_product_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/product/999/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 5
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 404


def test_submit_review_rejects_wrong_user(monkeypatch):
    fake_product_table = MagicMock()
    fake_orders_table = MagicMock()

    fake_orders_table.get_item.return_value = {
        "Item": {
            "order_id": "order-123",
            "user_id": "another-user",
            "items": {
                "1": {
                    "product_id": "1",
                    "product_name": "Phone",
                    "quantity": 1
                }
            },
            "reviewed_products": []
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_product_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/product/1/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 5
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 403


def test_submit_review_rejects_product_not_in_order(monkeypatch):
    fake_product_table = MagicMock()
    fake_orders_table = MagicMock()

    fake_orders_table.get_item.return_value = {
        "Item": {
            "order_id": "order-123",
            "user_id": "user-123",
            "items": {
                "2": {
                    "product_id": "2",
                    "product_name": "Headphones",
                    "quantity": 1
                }
            },
            "reviewed_products": []
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_product_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/product/1/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 5
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400


def test_submit_review_rejects_duplicate_review(monkeypatch):
    fake_product_table = MagicMock()
    fake_orders_table = MagicMock()

    fake_orders_table.get_item.return_value = {
        "Item": {
            "order_id": "order-123",
            "user_id": "user-123",
            "items": {
                "1": {
                    "product_id": "1",
                    "product_name": "Phone",
                    "quantity": 1
                }
            },
            "reviewed_products": ["1"]
        }
    }

    monkeypatch.setattr(lf, "get_table", lambda: fake_product_table)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders_table)

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/product/1/review",
        "body": json.dumps({
            "user_id": "user-123",
            "order_id": "order-123",
            "rating": 5
        })
    }

    response = lf.lambda_handler(event, None)

    assert response['statusCode'] == 400
