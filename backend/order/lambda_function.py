import json
import boto3
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_carts_table as shared_get_carts_table
from shared.dynamodb import get_orders_table as shared_get_orders_table
from shared.dynamodb import get_region
from shared.logger import get_logger, log_event
from shared.response import error_response, success_response
from shared.validators import ValidationError, validate_required_fields

logger = get_logger(__name__)

def get_sns_topic_arn():
    return os.environ.get('TOPIC_ARN', '')


def publish_sns(subject, message):
    """Publish to SNS only when a topic is configured."""
    topic_arn = get_sns_topic_arn()
    if not topic_arn:
        return

    try:
        sns = boto3.client(
            'sns',
            region_name=get_region()
        )
        sns.publish(TopicArn=topic_arn, Subject=subject, Message=message)
    except Exception as sns_error:
        logger.exception("Failed to publish SNS message")


def get_orders_table():
    return shared_get_orders_table()


def get_carts_table():
    return shared_get_carts_table()


def get_correlation_id(event):
    headers = event.get('headers') or {}
    return headers.get('x-correlation-id') or headers.get('X-Correlation-Id') or str(uuid.uuid4())


def normalize_cart_items(items):
    """Accept cart items stored as a mapping or a list and normalize to a mapping."""
    if isinstance(items, dict):
        iterable = items.items()
    elif isinstance(items, list):
        iterable = (
            (str(item.get('product_id', item.get('product'))), item)
            for item in items
        )
    else:
        raise ValueError("Cart items must be an object or list")

    normalized_items = {}
    for product_id, item in iterable:
        if not product_id or product_id == 'None':
            raise ValueError("Cart item is missing product_id")

        quantity = int(item.get('quantity', 0))
        if quantity <= 0:
            raise ValueError(f"Cart item {product_id} has invalid quantity")

        unit_price = Decimal(str(item.get('unit_price', item.get('price', 0))))
        total_price = Decimal(str(item.get('total_price', unit_price * quantity)))

        normalized_items[product_id] = {
            'product_id': str(item.get('product_id', product_id)),
            'product_name': item.get('product_name', item.get('product', product_id)),
            'unit_price': unit_price,
            'quantity': quantity,
            'total_price': total_price
        }

    return normalized_items

def get_order_route_parts(path):
    """Return route parts after /order or /v1/orders."""
    parts = [part for part in path.strip('/').split('/') if part]
    if len(parts) >= 2 and parts[0] == 'v1' and parts[1] in ('order', 'orders'):
        return parts[2:]
    if parts and parts[0] in ('order', 'orders'):
        return parts[1:]
    return []


def lambda_handler(event, context):
    """
    Order Lambda Handler
    Routes: GET, POST, DELETE /order
    """

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '/')
    route_parts = get_order_route_parts(path)
    correlation_id = get_correlation_id(event)
    log_event(
        logger,
        logging.INFO,
        "order_request_received",
        service="order",
        action=http_method,
        path=path,
        correlation_id=correlation_id
    )

    try:
        # POST /orders - Create new order
        if http_method == 'POST' and len(route_parts) == 0:
            body = json.loads(event.get('body', '{}'))
            return create_order(body, correlation_id)

        # GET /orders - Get all orders (admin)
        elif http_method == 'GET' and len(route_parts) == 0:
            return get_all_orders(correlation_id)

        # GET /orders/user/{user_id} - Get user's orders
        elif http_method == 'GET' and len(route_parts) >= 2 and route_parts[0] == 'user':
            user_id = route_parts[1]
            return get_user_orders(user_id, correlation_id)

        # GET /orders/{order_id} - Get order details
        elif http_method == 'GET' and len(route_parts) == 1:
            order_id = route_parts[0]
            return get_order(order_id, correlation_id)

        # DELETE /orders/{order_id} - Cancel order
        elif http_method == 'DELETE' and len(route_parts) == 1:
            order_id = route_parts[0]
            return cancel_order(order_id, correlation_id)

        # PUT /orders/{order_id}/status - Update order status (admin)
        elif http_method == 'PUT' and len(route_parts) == 2 and route_parts[1] == 'status':
            order_id = route_parts[0]
            body = json.loads(event.get('body', '{}'))
            return update_order_status(order_id, body, correlation_id)

        else:
            return error_response(400, "Invalid request", correlation_id)

    except json.JSONDecodeError:
        logger.warning("Invalid JSON request body")
        return error_response(400, "Invalid JSON request body", correlation_id)
    except Exception as e:
        logger.exception("Unhandled order request error")
        publish_sns(
            "Order Service Error",
            f"Error occurred in Order Service:\n\n{str(e)}"
        )

        return error_response(500, f"Internal server error: {str(e)}", correlation_id)

def create_order(body, correlation_id=None):
    """Create order from cart"""
    required_fields = ['user_id', 'shipping_address', 'email']

    try:
        validate_required_fields(body, required_fields)
        user_id = str(body['user_id'])

        # Get user's cart
        carts_table = get_carts_table()
        cart_response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in cart_response or not cart_response['Item'].get('items'):
            return error_response(400, "Cart is empty", correlation_id)

        cart = cart_response['Item']

        # Create order
        order_id = str(uuid.uuid4())
        # Convert float values from JSON back to Decimal for DynamoDB
        items = normalize_cart_items(cart['items'])
        
        order = {
            'order_id': order_id,
            'user_id': user_id,
            'items': items,
            'total_items': int(cart['total_items']),
            'total_price': Decimal(str(cart['total_price'])),
            'status': 'CONFIRMED',
            'shipping_address': body['shipping_address'],
            'email': body['email'],
            'notes': body.get('notes', ''),
            'payment_method': body.get('payment_method', 'CARD'),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'estimated_delivery': calculate_delivery_date()
        }

        try:
            # Save order
            orders_table = get_orders_table()
            orders_table.put_item(Item=order)
        except Exception as e:
            logger.exception("Failed to save order")
            raise e

        # Clear user's cart
        carts_table = get_carts_table()
        carts_table.delete_item(Key={'user_id': user_id})
        log_event(
            logger,
            logging.INFO,
            "order_created_cart_cleared",
            service="order",
            action="place_order",
            order_id=order_id,
            user_id=user_id,
            total_items=int(cart['total_items']),
            correlation_id=correlation_id
        )

        # After order is successfully saved
        publish_sns(
            "Order Confirmation",
            f"""
                Order placed successfully!

                Order ID: {order_id}
                User ID: {user_id}
                Total Items: {int(cart['total_items'])}
                Total Price: ${float(cart['total_price']):.2f}

                Shipping Address:
                {body['shipping_address']}

                Estimated Delivery:
                {order['estimated_delivery']}
                """
        )

        return success_response(201, {
            'message': 'Order created successfully',
            'data': order,
            'next_steps': 'Your order has been confirmed. Check your email for updates.'
        }, correlation_id)

    except ValidationError as e:
        return error_response(400, str(e), correlation_id)
    except Exception as e:
        logger.exception("Failed to create order")
        return error_response(500, f"Failed to create order: {str(e)}", correlation_id)


def get_order(order_id, correlation_id=None):
    """Get order details"""
    try:
        orders_table = get_orders_table()
        response = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in response:
            return error_response(404, f"Order {order_id} not found", correlation_id)

        order = response['Item']

        return success_response(200, {
            'message': f'Retrieved order {order_id}',
            'data': order
        }, correlation_id)

    except Exception as e:
        logger.exception("Failed to retrieve order")
        return error_response(500, f"Failed to retrieve order: {str(e)}", correlation_id)


def get_user_orders(user_id, correlation_id=None):
    """Get all orders for a user"""
    try:
        orders_table = get_orders_table()
        response = orders_table.scan(
            FilterExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id}
        )

        orders = response.get('Items', [])

        # Sort by created_at descending
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return success_response(200, {
            'message': f'Retrieved {len(orders)} orders for user {user_id}',
            'data': orders,
            'count': len(orders)
        }, correlation_id)

    except Exception as e:
        logger.exception("Failed to retrieve user orders")
        return error_response(500, f"Failed to retrieve orders: {str(e)}", correlation_id)


def cancel_order(order_id, correlation_id=None):
    """Cancel an order"""
    try:
        orders_table = get_orders_table()

        response = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in response:
            return error_response(404, f"Order {order_id} not found", correlation_id)

        order = response['Item']

        # Can only cancel if status is CONFIRMED
        if order['status'] != 'CONFIRMED':
            return error_response(400, f"Cannot cancel order with status: {order['status']}", correlation_id)

        # Update order status
        order['status'] = 'CANCELLED'
        order['updated_at'] = datetime.now().isoformat()
        order['cancelled_at'] = datetime.now().isoformat()

        orders_table.put_item(Item=order)

        return success_response(200, {
            'message': f'Order {order_id} cancelled successfully',
            'data': order
        }, correlation_id)

    except Exception as e:
        logger.exception("Failed to cancel order")
        return error_response(500, f"Failed to cancel order: {str(e)}", correlation_id)


def update_order_status(order_id, body, correlation_id=None):
    """Update order status (admin action: CONFIRMED → DISPATCHED → DELIVERED)"""
    VALID_STATUSES = ['CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']
    try:
        validate_required_fields(body, ['status'])
        new_status = str(body['status']).upper()

        if new_status not in VALID_STATUSES:
            return error_response(400, f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}", correlation_id)

        orders_table = get_orders_table()
        response = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in response:
            return error_response(404, f"Order {order_id} not found", correlation_id)

        order = response['Item']
        old_status = order.get('status', '')

        order['status'] = new_status
        order['updated_at'] = datetime.now().isoformat()
        if new_status == 'DELIVERED':
            order['delivered_at'] = datetime.now().isoformat()
        if new_status == 'DISPATCHED':
            order['dispatched_at'] = datetime.now().isoformat()

        orders_table.put_item(Item=order)

        log_event(
            logger,
            logging.INFO,
            "order_status_updated",
            service="order",
            action="update_status",
            order_id=order_id,
            old_status=old_status,
            new_status=new_status,
            correlation_id=correlation_id
        )

        return success_response(200, {
            'message': f'Order {order_id} status updated to {new_status}',
            'data': order
        }, correlation_id)

    except ValidationError as e:
        return error_response(400, str(e), correlation_id)
    except Exception as e:
        logger.exception("Failed to update order status")
        return error_response(500, f"Failed to update order status: {str(e)}", correlation_id)


def get_all_orders(correlation_id=None):
    """Get all orders (admin action)"""
    try:
        orders_table = get_orders_table()
        response = orders_table.scan()
        orders = response.get('Items', [])
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return success_response(200, {
            'message': f'Retrieved {len(orders)} orders',
            'data': orders,
            'count': len(orders)
        }, correlation_id)

    except Exception as e:
        logger.exception("Failed to retrieve all orders")
        return error_response(500, f"Failed to retrieve orders: {str(e)}", correlation_id)


def calculate_delivery_date():
    """Calculate estimated delivery date (5-7 business days)"""
    from datetime import timedelta
    delivery_date = datetime.now() + timedelta(days=7)
    return delivery_date.isoformat()
