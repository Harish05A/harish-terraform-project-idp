import json
import os
import sys
from datetime import datetime
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_orders_table as shared_get_orders_table
from shared.dynamodb import get_products_table
from shared.logger import get_logger
from shared.response import error_response, success_response
from shared.validators import (
    ValidationError,
    parse_decimal,
    parse_non_negative_int,
    validate_rating,
    validate_required_fields,
)

logger = get_logger(__name__)


def get_table():
    return get_products_table()


def get_orders_table():
    return shared_get_orders_table()


def build_rating_fields(body):
    """Build consistent rating fields for a product."""
    if 'rating_average' in body or 'rating_count' in body or 'rating_total' in body:
        rating_average = Decimal(str(body.get('rating_average', 0)))
        rating_count = int(body.get('rating_count', 0))
        rating_total = Decimal(str(body.get('rating_total', rating_average * rating_count)))
    else:
        # Backward-compatible path for older clients that still send `rating`.
        rating_average = Decimal(str(body.get('rating', 0)))
        rating_count = 0
        rating_total = Decimal('0')

    return {
        'rating_average': rating_average,
        'rating_count': rating_count,
        'rating_total': rating_total,
        # Keep `rating` in responses for the current frontend until the UI is updated.
        'rating': rating_average
    }


def serialize_product(product):
    """Convert Decimal fields into JSON-friendly numbers."""
    if 'price' in product and isinstance(product['price'], Decimal):
        product['price'] = float(product['price'])

    for field in ['rating', 'rating_average', 'rating_total']:
        if field in product and isinstance(product[field], Decimal):
            product[field] = float(product[field])

    if 'rating_count' in product:
        product['rating_count'] = int(product['rating_count'])

    return product


def get_order_items(order):
    """Normalize order items into a list for validation."""
    items = order.get('items', {})
    if isinstance(items, list):
        return items
    if isinstance(items, dict):
        return list(items.values())
    return []


def lambda_handler(event, context):
    """
    Product Lambda Handler
    Routes: GET, POST, PUT, DELETE /product
            POST /product/{id}/review
    """

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath') or '/product'
    path_parts = path.strip('/').split('/')

    try:
        # GET /product - List all products
        if http_method == 'GET' and path == '/product':
            return get_all_products()

        # POST /product - Add new product
        elif http_method == 'POST' and path == '/product':
            body = json.loads(event.get('body', '{}'))
            return create_product(body)

        # POST /product/{id}/review - Submit a product rating
        elif http_method == 'POST' and len(path_parts) == 3 and path_parts[0] == 'product' and path_parts[2] == 'review':
            product_id = path_parts[1]
            body = json.loads(event.get('body', '{}'))
            return submit_review(product_id, body)

        # PUT /product/{id} - Update product
        elif http_method == 'PUT' and len(path_parts) == 2 and path_parts[0] == 'product':
            product_id = path.split('/')[-1]
            body = json.loads(event.get('body', '{}'))
            return update_product(product_id, body)

        # DELETE /product/{id} - Delete product
        elif http_method == 'DELETE' and len(path_parts) == 2 and path_parts[0] == 'product':
            product_id = path.split('/')[-1]
            return delete_product(product_id)

        else:
            return error_response(400, "Method not allowed")

    except json.JSONDecodeError:
        logger.warning("Invalid JSON request body")
        return error_response(400, "Invalid JSON request body")
    except Exception as e:
        logger.exception("Unhandled product request error")
        return error_response(500, f"Internal server error: {str(e)}")


def get_all_products():
    """Fetch all products from DynamoDB"""
    try:
        table = get_table()
        response = table.scan()
        products = response.get('Items', [])

        for product in products:
            serialize_product(product)

        return success_response(200, {
            'message': f'Retrieved {len(products)} products',
            'data': products,
            'count': len(products)
        })
    except Exception as e:
        logger.exception("Failed to fetch products")
        return error_response(500, f"Failed to fetch products: {str(e)}")


def create_product(body):
    """Create a new product"""
    required_fields = ['product_id', 'name', 'price', 'description']

    try:
        validate_required_fields(body, required_fields)
        # Convert price to Decimal
        price = parse_decimal(body['price'], 'price')

        product = {
            'product_id': str(body['product_id']),
            'name': str(body['name']),
            'price': price,
            'description': str(body['description']),
            'stock': parse_non_negative_int(body.get('stock', 0), 'stock'),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
        }
        product.update(build_rating_fields(body))
        table = get_table()

        table.put_item(Item=product)

        serialize_product(product)

        return success_response(201, {
            'message': 'Product created successfully',
            'data': product
        })
    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to create product")
        return error_response(500, f"Failed to create product: {str(e)}")


def update_product(product_id, body):
    """Update an existing product"""
    try:
        table = get_table()
        # Check if product exists
        response = table.get_item(Key={'product_id': product_id})
        if 'Item' not in response:
            return error_response(404, f"Product {product_id} not found")

        # Update only provided fields
        update_data = {
            'updated_at': datetime.now().isoformat()
        }

        if 'name' in body:
            update_data['name'] = str(body['name'])
        if 'price' in body:
            update_data['price'] = parse_decimal(body['price'], 'price')
        if 'description' in body:
            update_data['description'] = str(body['description'])
        if 'stock' in body:
            update_data['stock'] = parse_non_negative_int(body['stock'], 'stock')
        if any(field in body for field in ['rating', 'rating_average', 'rating_count', 'rating_total']):
            update_data.update(build_rating_fields(body))

        # Build update expression
        update_expr = 'SET ' + ', '.join([f'{k} = :{k}' for k in update_data.keys()])
        expr_attr_values = {f':{k}': v for k, v in update_data.items()}

        response = table.update_item(
            Key={'product_id': product_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_attr_values,
            ReturnValues='ALL_NEW'
        )

        # Convert response
        if 'Attributes' in response:
            item = response['Attributes']
            serialize_product(item)

        return success_response(200, {
            'message': f'Product {product_id} updated successfully',
            'data': response.get('Attributes', update_data)
        })
    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to update product")
        return error_response(500, f"Failed to update product: {str(e)}")


def delete_product(product_id):
    """Delete a product"""
    try:
        table = get_table()

        # Check if product exists
        response = table.get_item(Key={'product_id': product_id})
        if 'Item' not in response:
            return error_response(404, f"Product {product_id} not found")

        table.delete_item(Key={'product_id': product_id})

        return success_response(200, {
            'message': f'Product {product_id} deleted successfully'
        })
    except Exception as e:
        logger.exception("Failed to delete product")
        return error_response(500, f"Failed to delete product: {str(e)}")


def submit_review(product_id, body):
    """Submit a new star rating for a product."""
    try:
        validate_required_fields(body, ['user_id', 'order_id', 'rating'])
        rating_value = validate_rating(body['rating'])
        orders_table = get_orders_table()
        order_response = orders_table.get_item(Key={'order_id': str(body['order_id'])})
        if 'Item' not in order_response:
            return error_response(404, f"Order {body['order_id']} not found")

        order = order_response['Item']
        if str(order.get('user_id')) != str(body['user_id']):
            return error_response(403, "This order does not belong to the given user")

        order_items = get_order_items(order)
        if not any(str(item.get('product_id')) == str(product_id) for item in order_items):
            return error_response(400, "This product was not purchased in the given order")

        reviewed_products = [str(pid) for pid in order.get('reviewed_products', [])]
        if str(product_id) in reviewed_products:
            return error_response(400, "This product has already been reviewed for the given order")

        table = get_table()
        response = table.get_item(Key={'product_id': product_id})
        if 'Item' not in response:
            return error_response(404, f"Product {product_id} not found")

        product = response['Item']
        current_total = Decimal(str(product.get('rating_total', 0)))
        current_count = int(product.get('rating_count', 0))

        new_total = current_total + rating_value
        new_count = current_count + 1
        new_average = new_total / Decimal(str(new_count))
        updated_at = datetime.now().isoformat()

        update_response = table.update_item(
            Key={'product_id': product_id},
            UpdateExpression=(
                'SET rating_total = :rating_total, '
                'rating_count = :rating_count, '
                'rating_average = :rating_average, '
                'rating = :rating, '
                'updated_at = :updated_at'
            ),
            ExpressionAttributeValues={
                ':rating_total': new_total,
                ':rating_count': new_count,
                ':rating_average': new_average,
                ':rating': new_average,
                ':updated_at': updated_at
            },
            ReturnValues='ALL_NEW'
        )

        updated_product = update_response.get('Attributes', {})
        serialize_product(updated_product)

        reviewed_products.append(str(product_id))
        order['reviewed_products'] = reviewed_products
        order['updated_at'] = updated_at
        orders_table.put_item(Item=order)

        return success_response(200, {
            'message': f'Review submitted for product {product_id}',
            'data': updated_product
        })
    except ValidationError as e:
        return error_response(400, str(e))
    except Exception as e:
        logger.exception("Failed to submit review")
        return error_response(500, f"Failed to submit review: {str(e)}")
