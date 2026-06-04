import json
import pytest
from unittest.mock import MagicMock, patch
import lambda_function as lf


def test_bff_dashboard_success(monkeypatch):
    fake_carts = MagicMock()
    fake_orders = MagicMock()
    fake_products = MagicMock()

    # Mock Cart Data
    fake_carts.get_item.return_value = {
        "Item": {
            "user_id": "user-123",
            "items": {
                "p1": {
                    "product_id": "p1",
                    "product_name": "Phone",
                    "quantity": 1,
                    "unit_price": 1000
                }
            },
            "total_items": 1,
            "total_price": 1000
        }
    }

    # Mock Orders Data
    fake_orders.query.return_value = {
        "Items": [
            {
                "order_id": "o1",
                "user_id": "user-123",
                "created_at": "2026-06-04T10:00:00",
                "total_price": 1000,
                "status": "CONFIRMED"
            }
        ]
    }

    # Mock Products Data (Recommendations)
    fake_products.scan.return_value = {
        "Items": [
            {
                "product_id": "p2",
                "name": "Laptop",
                "price": 1500,
                "stock": 5
            }
        ]
    }

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "queryStringParameters": {
            "userId": "user-123"
        }
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert "cart" in body
    assert "recentOrders" in body
    assert "recommendedProducts" in body

    # Assert content matches mocks
    assert body['cart']['user_id'] == "user-123"
    assert len(body['recentOrders']) == 1
    assert body['recentOrders'][0]['order_id'] == "o1"
    assert len(body['recommendedProducts']) == 1
    assert body['recommendedProducts'][0]['product_id'] == "p2"

    # Verify tables were queried correctly
    fake_carts.get_item.assert_called_once_with(Key={'user_id': 'user-123'})
    fake_orders.query.assert_called_once()
    fake_products.scan.assert_called_once_with(Limit=3)


def test_bff_dashboard_missing_userid(monkeypatch):
    event = {
        "queryStringParameters": {}
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 400
    assert "Missing required query parameter" in body['error']


def test_bff_dashboard_internal_error(monkeypatch):
    fake_carts = MagicMock()
    # Force query to raise an exception
    fake_carts.get_item.side_effect = Exception("DB Connection Refused")

    fake_orders = MagicMock()
    fake_orders.query.return_value = {"Items": []}

    fake_products = MagicMock()
    fake_products.scan.return_value = {"Items": []}

    monkeypatch.setattr(lf, "get_carts_table", lambda: fake_carts)
    monkeypatch.setattr(lf, "get_orders_table", lambda: fake_orders)
    monkeypatch.setattr(lf, "get_products_table", lambda: fake_products)

    event = {
        "queryStringParameters": {
            "userId": "user-123"
        }
    }

    response = lf.lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    # The BFF should handle fetch errors gracefully, returning empty placeholders
    assert body['cart'] == {}
    assert body['recentOrders'] == []
    assert body['recommendedProducts'] == []
