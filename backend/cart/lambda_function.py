import json
import os
import sys
from datetime import datetime
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_carts_table as shared_get_carts_table
from shared.dynamodb import get_products_table as shared_get_products_table
from shared.logger import get_logger
from shared.response import error_response, success_response
from shared.validators import ValidationError, parse_positive_int, validate_required_fields

logger = get_logger(__name__)


def get_carts_table():
    return shared_get_carts_table()


def get_products_table():
    return shared_get_products_table()


def build_cart_payload(user_id, cart, message):
    return {
        'message': message,
        'data': {
            'user_id': user_id,
            'items': cart.get('items', {}),
            'total_items': cart.get('total_items', 0),
            'total_price': cart.get('total_price', 0),
            'created_at': cart.get('created_at'),
            'updated_at': cart.get('updated_at')
        }
    }


def normalize_cart_items(items):
    """Accept cart items stored as a mapping or a list and normalize to a mapping."""
    if isinstance(items, dict):
        return items

    if not isinstance(items, list):
        raise ValueError("Cart items must be an object or list")

    normalized_items = {}
    for item in items:
        product_id = str(item.get('product_id', item.get('product')))
        if not product_id or product_id == 'None':
            raise ValueError("Cart item is missing product_id")

        quantity = int(item.get('quantity', 0))
        unit_price = Decimal(str(item.get('unit_price', item.get('price', 0))))
        total_price = Decimal(str(item.get('total_price', unit_price * quantity)))

        normalized_items[product_id] = {
            'product_id': product_id,
            'product_name': item.get('product_name', item.get('product', product_id)),
            'unit_price': unit_price,
            'quantity': quantity,
            'total_price': total_price
        }

    return normalized_items


def normalize_cart(cart, user_id):
    normalized_cart = dict(cart)
    normalized_cart['user_id'] = user_id
    normalized_cart['items'] = normalize_cart_items(cart.get('items', {}))
    normalized_cart['created_at'] = cart.get('created_at')
    normalized_cart['updated_at'] = cart.get('updated_at')
    return normalized_cart

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

    except json.JSONDecodeError:
        logger.warning("Invalid JSON request body")
        return error_response(400, "Invalid JSON request body")
    except Exception as e:
        logger.exception("Unhandled cart request error")
        return error_response(500, f"Internal server error: {str(e)}")


def add_to_cart(body):
    """Add item to user's cart"""
    required_fields = ['user_id', 'product_id', 'quantity']

    try:
        validate_required_fields(body, required_fields)
        carts_table = get_carts_table()
        products_table = get_products_table()   
        user_id = str(body['user_id'])
        product_id = str(body['product_id'])
        quantity = parse_positive_int(body['quantity'], 'Quantity')

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
        cart = normalize_cart(cart, user_id)

        # Add or update item in cart
        cart['items'][product_id] = {
            'product_id': product_id,
            'product_name': product['name'],
            'unit_price': product['price'],  # Keep as Decimal
            'quantity': quantity,
            'total_price': product['price'] * quantity  # Keep as Decimal
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

    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to add to cart")
        return error_response(500, f"Failed to add to cart: {str(e)}")


def get_cart(user_id):
    """Get user's cart"""
    try:
        carts_table = get_carts_table()
        response = carts_table.get_item(Key={'user_id': user_id})

        if 'Item' not in response:
            # Return empty cart
            empty_cart = {
                'user_id': user_id,
                'items': {},
                'total_items': 0,
                'total_price': 0,
                'created_at': None,
                'updated_at': None
            }
            return success_response(200, build_cart_payload(user_id, empty_cart, 'Cart is empty'))

        cart = normalize_cart(response['Item'], user_id)
        return success_response(200, build_cart_payload(user_id, cart, f"Retrieved cart for {user_id}"))

    except Exception as e:
        logger.exception("Failed to retrieve cart")
        return error_response(500, f"Failed to retrieve cart: {str(e)}")


def update_cart_item(user_id, product_id, body):
    """Update quantity of item in cart"""
    try:
        carts_table = get_carts_table()
        products_table = get_products_table()
        validate_required_fields(body, ['quantity'])
        quantity = parse_positive_int(body.get('quantity'), 'Quantity')

        # Get cart
        response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            return error_response(404, "Cart not found")

        cart = normalize_cart(response['Item'], user_id)

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

    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to update cart")
        return error_response(500, f"Failed to update cart: {str(e)}")


def remove_from_cart(user_id, product_id):
    """Remove item from cart"""
    try:
        carts_table = get_carts_table()
        # products_table = get_products_table()
        response = carts_table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            return error_response(404, "Cart not found")

        cart = normalize_cart(response['Item'], user_id)

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
        logger.exception("Failed to remove from cart")
        return error_response(500, f"Failed to remove from cart: {str(e)}")


def clear_cart(user_id):
    """Clear entire cart"""
    try:
        carts_table = get_carts_table()
        carts_table.delete_item(Key={'user_id': user_id})

        return success_response(200, {
            'message': 'Cart cleared',
            'user_id': user_id
        })

    except Exception as e:
        logger.exception("Failed to clear cart")
        return error_response(500, f"Failed to clear cart: {str(e)}")
