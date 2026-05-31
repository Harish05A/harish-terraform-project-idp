import json
from decimal import Decimal

from .constants import (
    ALLOWED_HEADERS,
    ALLOWED_METHODS,
    ALLOWED_ORIGINS,
    CONTENT_TYPE_JSON,
)


def decimal_default(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError


def response_headers():
    return {
        "Content-Type": CONTENT_TYPE_JSON,
        "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
    }


def success_response(status_code, data):
    return {
        "statusCode": status_code,
        "headers": response_headers(),
        "body": json.dumps(data, default=decimal_default),
    }


def error_response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": response_headers(),
        "body": json.dumps({"error": message}),
    }
