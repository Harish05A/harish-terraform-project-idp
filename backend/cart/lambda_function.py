import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# DynamoDB client
dynamodb = boto3.resource('dynamodb')
carts_table_name = os.environ.get('CARTS_TABLE')
products_table_name = os.environ.get('PRODUCTS_TABLE')

carts_table = dynamodb.Table(carts_table_name)
products_table = dynamodb.Table(products_table_name)

def lambda_handler(event, context):
    """
    Cart Lambda Handler
    Routes: GET, POST, PUT, DELETE /cart
    """

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '/')
    path_parts = path.split('/')

    try:
        # POST /cart - Add item to cart
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return add_to_cart(body)

        # GET /cart/{user_id} - Get user's cart
        elif http_method == 'GET' and len(path_parts) >= 3:
            user_id = path_parts[2]
            return get_cart(user_id)

        # PUT /cart/{user_id}/{product_id} - Update quantity
        elif http_method == 'PUT' and len(path_parts) >= 4:
            user_id = path_parts[2]
            product_id = path_parts[3]
            body = json.loads(event.get('body', '{}'))
            return update_cart_item(user_id, product_id, body)

        # DELETE /cart/{user_id}/{product_id} - Remove item
        elif http_method == 'DELETE' and len(path_parts) >= 4:
            user_id = path_parts[2]
            product_id = path_parts[3]
            return remove_from_cart(user_id, product_id)

        # DELETE /cart/{user_id} - Clear entire cart
        elif http_method == 'DELETE' and len(path_parts) >= 3:
            user_id = path_parts[2]
            return clear_cart(user_id)

        else:
            return error_response(400, "Invalid request")

    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f"Internal server error: {str(e)}")


def add_to_cart(body):
    """Add item to user's cart"""
    required_fields = ['user_id', 'product_id', 'quantity']

    for field in required_fields:
        if field not in body:
            return error_response(400, f"Missing required field: {field}")

    try:
        user_id = str(body['user_id'])
        product_id = str(body['product_id'])
        quantity = int(body['quantity'])

        if quantity <= 0:
            return error_response(400, "Quantity must be greater than 0")

        # Verify product exists
        product_response = products_table.get_item(Key={'product_id': product_id})
        if 'Item' not in product_response:
            return error_response(404, f"Product {product_id} not found")

        product = product_response['Item']

        # Get or create cart
        cart_response = carts_table.get_item(Key={'user_id': user_id})
        cart = cart_response.get('Item', {
            'user_id': user_id,
            'items': {},
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })

        # Add or update item in cart
        cart['items'][product_id] = {
            'product_id': product_id,
            'product_name': product['name'],
            'unit_price': product['price'],
            'quantity': quantity,
            'total_price': product['price'] * quantity
        }

        cart['updated_at'] = datetime.now().isoformat()

        # Calculate cart total
        cart['total_items'] = sum(item['quantity'] for item in cart['items'].values())
        cart['total_price'] = sum(item['total_price'] for item in cart['items'].values())

        carts_table.put_item(Item=cart)

        return success_response(200, {
            'message': f'Added {quantity} of {product["name"]} to cart',
            'data': cart
        })

    except Exception as e:
        return error_response(500, f"Failed to add to cart: {str(e)}")


def get_cart(user_id):
    """Get user's cart"""
    try:
        response = carts_table.get_item(Key={'user_id': user_id})

        if 'Item' not in response:
            # Return empty cart
            empty_cart = {
                'user_id': user_id,
                'items': {},
                'total_items': 0,
                'total_price': 0,
                'message': 'Cart is empty'
            }
            return success_response(200, empty_cart)

        cart = response['Item']
        return success_response(200, cart)

    except Exception as e:
        return error_response(500, f"Failed to retrieve cart: {str(e)}")


def update_cart_item(user_id, product_id, body):
    """Update quantity of item in cart"""
    try:
        quantity = int(body.get('quantity', 0))

        if quantity <= 0:
            return error_response(400, "Quantity must be greater than 0")

        # Get cart
        response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            return error_response(404, "Cart not found")

        cart = response['Item']

        if product_id not in cart['items']:
            return error_response(404, f"Product not in cart")

        # Get product price
        product_response = products_table.get_item(Key={'product_id': product_id})
        if 'Item' not in product_response:
            return error_response(404, "Product not found")

        product = product_response['Item']

        # Update item
        cart['items'][product_id]['quantity'] = quantity
        cart['items'][product_id]['total_price'] = product['price'] * quantity
        cart['updated_at'] = datetime.now().isoformat()

        # Recalculate totals
        cart['total_items'] = sum(item['quantity'] for item in cart['items'].values())
        cart['total_price'] = sum(item['total_price'] for item in cart['items'].values())

        carts_table.put_item(Item=cart)

        return success_response(200, {
            'message': f'Updated quantity for {product_id}',
            'data': cart
        })

    except Exception as e:
        return error_response(500, f"Failed to update cart: {str(e)}")


def remove_from_cart(user_id, product_id):
    """Remove item from cart"""
    try:
        response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            return error_response(404, "Cart not found")

        cart = response['Item']

        if product_id not in cart['items']:
            return error_response(404, f"Product not in cart")

        # Remove item
        product_name = cart['items'][product_id]['product_name']
        del cart['items'][product_id]
        cart['updated_at'] = datetime.now().isoformat()

        # Recalculate totals
        if cart['items']:
            cart['total_items'] = sum(item['quantity'] for item in cart['items'].values())
            cart['total_price'] = sum(item['total_price'] for item in cart['items'].values())
        else:
            cart['total_items'] = 0
            cart['total_price'] = 0

        carts_table.put_item(Item=cart)

        return success_response(200, {
            'message': f'Removed {product_name} from cart',
            'data': cart
        })

    except Exception as e:
        return error_response(500, f"Failed to remove from cart: {str(e)}")


def clear_cart(user_id):
    """Clear entire cart"""
    try:
        carts_table.delete_item(Key={'user_id': user_id})

        return success_response(200, {
            'message': 'Cart cleared',
            'user_id': user_id
        })

    except Exception as e:
        return error_response(500, f"Failed to clear cart: {str(e)}")


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
