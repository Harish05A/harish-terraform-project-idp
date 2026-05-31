import json
import boto3
import os
import sys
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_carts_table as shared_get_carts_table
from shared.dynamodb import get_orders_table as shared_get_orders_table
from shared.dynamodb import get_region
from shared.logger import get_logger
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

def lambda_handler(event, context):
    """
    Order Lambda Handler
    Routes: GET, POST, DELETE /order
    """

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '/')
    path_parts = path.split('/')

    try:
        # POST /order - Create new order
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_order(body)

        # GET /order/{order_id} - Get order details
        elif http_method == 'GET' and len(path_parts) >= 3 and path_parts[2] != 'user':
            order_id = path_parts[2]
            return get_order(order_id)

        # GET /order/user/{user_id} - Get user's orders
        elif http_method == 'GET' and len(path_parts) >= 4 and path_parts[2] == 'user':
            user_id = path_parts[3]
            return get_user_orders(user_id)

        # DELETE /order/{order_id} - Cancel order
        elif http_method == 'DELETE' and len(path_parts) >= 3:
            order_id = path_parts[2]
            return cancel_order(order_id)

        else:
            return error_response(400, "Invalid request")

    except json.JSONDecodeError:
        logger.warning("Invalid JSON request body")
        return error_response(400, "Invalid JSON request body")
    except Exception as e:
        logger.exception("Unhandled order request error")
        publish_sns(
            "Order Service Error",
            f"Error occurred in Order Service:\n\n{str(e)}"
        )

        return error_response(500, f"Internal server error: {str(e)}")

def create_order(body):
    """Create order from cart"""
    required_fields = ['user_id', 'shipping_address', 'email']

    try:
        validate_required_fields(body, required_fields)
        user_id = str(body['user_id'])

        # Get user's cart
        carts_table = get_carts_table()
        cart_response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in cart_response or not cart_response['Item'].get('items'):
            return error_response(400, "Cart is empty")

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
        })

    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to create order")
        return error_response(500, f"Failed to create order: {str(e)}")


def get_order(order_id):
    """Get order details"""
    try:
        orders_table = get_orders_table()
        response = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in response:
            return error_response(404, f"Order {order_id} not found")

        order = response['Item']

        return success_response(200, {
            'message': f'Retrieved order {order_id}',
            'data': order
        })

    except Exception as e:
        logger.exception("Failed to retrieve order")
        return error_response(500, f"Failed to retrieve order: {str(e)}")


def get_user_orders(user_id):
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
        })

    except Exception as e:
        logger.exception("Failed to retrieve user orders")
        return error_response(500, f"Failed to retrieve orders: {str(e)}")


def cancel_order(order_id):
    """Cancel an order"""
    try:
        orders_table = get_orders_table()

        response = orders_table.get_item(Key={'order_id': order_id})

        if 'Item' not in response:
            return error_response(404, f"Order {order_id} not found")

        order = response['Item']

        # Can only cancel if status is CONFIRMED
        if order['status'] != 'CONFIRMED':
            return error_response(400, f"Cannot cancel order with status: {order['status']}")

        # Update order status
        order['status'] = 'CANCELLED'
        order['updated_at'] = datetime.now().isoformat()
        order['cancelled_at'] = datetime.now().isoformat()

        orders_table.put_item(Item=order)

        return success_response(200, {
            'message': f'Order {order_id} cancelled successfully',
            'data': order
        })

    except Exception as e:
        logger.exception("Failed to cancel order")
        return error_response(500, f"Failed to cancel order: {str(e)}")


def calculate_delivery_date():
    """Calculate estimated delivery date (5-7 business days)"""
    from datetime import timedelta
    delivery_date = datetime.now() + timedelta(days=7)
    return delivery_date.isoformat()
