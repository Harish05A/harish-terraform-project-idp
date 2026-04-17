import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

sns = boto3.client('sns')
SNS_TOPIC_ARN =os.environ['TOPIC_ARN']

# DynamoDB client
def get_orders_table():
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.environ.get('AWS_REGION', 'ap-southeast-1')
    )
    return dynamodb.Table(os.environ.get('ORDERS_TABLE'))


def get_carts_table():
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.environ.get('AWS_REGION', 'ap-southeast-1')
    )
    return dynamodb.Table(os.environ.get('CARTS_TABLE'))

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

    except Exception as e:
        print(f"Error: {str(e)}")

        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="Order Service Error",
                Message=f"Error occurred in Order Service:\n\n{str(e)}"
            )
        except Exception as sns_error:
            print(f"SNS Error: {str(sns_error)}")

        return error_response(500, f"Internal server error: {str(e)}")

def create_order(body):
    """Create order from cart"""
    required_fields = ['user_id', 'shipping_address', 'email']

    for field in required_fields:
        if field not in body:
            return error_response(400, f"Missing required field: {field}")

    try:
        user_id = str(body['user_id'])

        # Get user's cart
        carts_table = get_carts_table()
        cart_response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in cart_response or not cart_response['Item'].get('items'):
            return error_response(400, "Cart is empty")

        cart = cart_response['Item']

        # Create order
        order_id = str(uuid.uuid4())
        order = {
            'order_id': order_id,
            'user_id': user_id,
            'items': cart['items'],
            'total_items': cart['total_items'],
            'total_price': cart['total_price'],
            'status': 'CONFIRMED',
            'shipping_address': body['shipping_address'],
            'email': body['email'],
            'notes': body.get('notes', ''),
            'payment_method': body.get('payment_method', 'CARD'),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'estimated_delivery': calculate_delivery_date()
        }

        # Save order
        orders_table = get_orders_table()
        orders_table.put_item(Item=order)

        # Clear user's cart
        carts_table = get_carts_table()
        carts_table.delete_item(Key={'user_id': user_id})

        # After order is successfully saved

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Order Confirmation",
            Message=f"""
                Order placed successfully!

                Order ID: {order_id}
                User ID: {user_id}
                Total Items: {cart['total_items']}
                Total Price: {cart['total_price']}

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

    except Exception as e:
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
        return error_response(500, f"Failed to cancel order: {str(e)}")


def calculate_delivery_date():
    """Calculate estimated delivery date (5-7 business days)"""
    from datetime import timedelta
    delivery_date = datetime.now() + timedelta(days=7)
    return delivery_date.isoformat()


def success_response(status_code, data):
    """Return success response"""
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(data, default=str)
    }


def error_response(status_code, message):
    """Return error response"""
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': message})
    }
