import json
import os
import sys
import logging
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_carts_table, get_orders_table, get_products_table
from shared.response import error_response, success_response
from shared.logger import get_logger

logger = get_logger(__name__)


def fetch_cart(user_id):
    """Retrieve cart details for the user."""
    try:
        table = get_carts_table()
        res = table.get_item(Key={'user_id': user_id})
        # If cart doesn't exist, return a default empty cart response
        return res.get('Item', {
            'user_id': user_id,
            'items': {},
            'total_items': 0,
            'total_price': Decimal('0')
        })
    except Exception:
        logger.exception(f"Failed to fetch cart for user {user_id}")
        return {}


def fetch_orders(user_id):
    """Retrieve recent orders for the user using the user_id-index GSI."""
    try:
        table = get_orders_table()
        res = table.query(
            IndexName='user_id-index',
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        orders = res.get('Items', [])
        # Sort recent orders descending by created_at and take the top 5
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return orders[:5]
    except Exception:
        logger.exception(f"Failed to fetch orders for user {user_id}")
        return []


def fetch_recommended_products():
    """Retrieve a small list of products from catalog to serve as recommendations."""
    try:
        table = get_products_table()
        # Scan table with a Limit of 3 for cost-effective recommendations
        res = table.scan(Limit=3)
        return res.get('Items', [])
    except Exception:
        logger.exception("Failed to fetch recommended products")
        return []


def lambda_handler(event, context):
    """
    BFF Dashboard Aggregation Lambda
    Routes: GET /v1/bff/dashboard?userId=<userId>
    """
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('userId')

    if not user_id:
        return error_response(400, "Missing required query parameter 'userId'")

    logger.info(f"BFF Dashboard Aggregation requested for user: {user_id}")

    try:
        # Run DB queries in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=3) as executor:
            cart_future = executor.submit(fetch_cart, user_id)
            orders_future = executor.submit(fetch_orders, user_id)
            products_future = executor.submit(fetch_recommended_products)

            cart_data = cart_future.result()
            orders_data = orders_future.result()
            products_data = products_future.result()

        dashboard_data = {
            "cart": cart_data,
            "recentOrders": orders_data,
            "recommendedProducts": products_data
        }

        return success_response(200, dashboard_data)

    except Exception as e:
        logger.exception("Unhandled error in BFF Lambda")
        return error_response(500, f"Internal server error: {str(e)}")
