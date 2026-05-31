import os

import boto3

from .constants import (
    CARTS_TABLE_ENV,
    DEFAULT_CARTS_TABLE,
    DEFAULT_ORDERS_TABLE,
    DEFAULT_PRODUCTS_TABLE,
    DEFAULT_REGION,
    ORDERS_TABLE_ENV,
    PRODUCTS_TABLE_ENV,
)

_dynamodb_resource = None


def get_region():
    return os.environ.get("REGION_NAME", DEFAULT_REGION)


def get_dynamodb_resource():
    global _dynamodb_resource
    if _dynamodb_resource is None:
        _dynamodb_resource = boto3.resource("dynamodb", region_name=get_region())
    return _dynamodb_resource


def get_table(table_env_name, default_table_name=None):
    table_name = os.environ.get(table_env_name, default_table_name)
    if not table_name:
        raise ValueError(f"Missing DynamoDB table configuration: {table_env_name}")
    return get_dynamodb_resource().Table(table_name)


def get_products_table():
    return get_table(PRODUCTS_TABLE_ENV, DEFAULT_PRODUCTS_TABLE)


def get_carts_table():
    return get_table(CARTS_TABLE_ENV, DEFAULT_CARTS_TABLE)


def get_orders_table():
    return get_table(ORDERS_TABLE_ENV, DEFAULT_ORDERS_TABLE)
