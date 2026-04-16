import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# DynamoDB resource

# table_name = os.environ.get('PRODUCTS_TABLE')
def get_table():
    dynamodb = dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.environ.get('AWS_REGION', 'ap-southeast-1'))
    return dynamodb.Table(os.environ.get('PRODUCTS_TABLE'))


def lambda_handler(event, context):
    """
    Product Lambda Handler
    Routes: GET, POST, PUT, DELETE /product
    """

    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '/')

    try:
        # GET /product - List all products
        if http_method == 'GET':
            return get_all_products()

        # POST /product - Add new product
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_product(body)

        # PUT /product/{id} - Update product
        elif http_method == 'PUT':
            product_id = path.split('/')[-1]
            body = json.loads(event.get('body', '{}'))
            return update_product(product_id, body)

        # DELETE /product/{id} - Delete product
        elif http_method == 'DELETE':
            product_id = path.split('/')[-1]
            return delete_product(product_id)

        else:
            return error_response(400, "Method not allowed")

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, f"Internal server error: {str(e)}")


def get_all_products():
    """Fetch all products from DynamoDB"""
    try:
        table = get_table()
        response = table.scan()
        products = response.get('Items', [])

        # Convert Decimals to floats
        for product in products:
            if 'price' in product and isinstance(product['price'], Decimal):
                product['price'] = float(product['price'])

        return success_response(200, {
            'message': f'Retrieved {len(products)} products',
            'data': products,
            'count': len(products)
        })
    except Exception as e:
        return error_response(500, f"Failed to fetch products: {str(e)}")


def create_product(body):
    """Create a new product"""
    required_fields = ['product_id', 'name', 'price', 'description']

    # Validate required fields
    for field in required_fields:
        if field not in body:
            return error_response(400, f"Missing required field: {field}")

    try:
        # Convert price to Decimal
        price_value = body['price']
        if isinstance(price_value, str):
            price = Decimal(price_value)
        else:
            price = Decimal(str(price_value))

        product = {
            'product_id': str(body['product_id']),
            'name': str(body['name']),
            'price': price,
            'description': str(body['description']),
            'stock': int(body.get('stock', 0)),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        table = get_table()

        table.put_item(Item=product)

        # Return response with float price
        product['price'] = float(product['price'])

        return success_response(201, {
            'message': 'Product created successfully',
            'data': product
        })
    except Exception as e:
        print(f"Create error: {str(e)}")
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
            update_data['price'] = Decimal(str(body['price']))
        if 'description' in body:
            update_data['description'] = str(body['description'])
        if 'stock' in body:
            update_data['stock'] = int(body['stock'])

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
            if 'price' in item and isinstance(item['price'], Decimal):
                item['price'] = float(item['price'])

        return success_response(200, {
            'message': f'Product {product_id} updated successfully',
            'data': update_data
        })
    except Exception as e:
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
        return error_response(500, f"Failed to delete product: {str(e)}")


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

