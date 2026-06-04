from decimal import Decimal, InvalidOperation


class ValidationError(ValueError):
    pass


def validate_required_fields(body, required_fields):
    for field in required_fields:
        if field not in body or body[field] in (None, ""):
            raise ValidationError(f"Missing required field: {field}")


def parse_positive_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid integer")

    if parsed <= 0:
        raise ValidationError(f"{field_name} must be greater than 0")
    return parsed


def parse_non_negative_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid integer")

    if parsed < 0:
        raise ValidationError(f"{field_name} must be 0 or greater")
    return parsed


def parse_decimal(value, field_name):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid number")


def validate_rating(value):
    rating = parse_decimal(value, "Rating")
    if rating < 1 or rating > 5:
        raise ValidationError("Rating must be between 1 and 5")
    return rating


def validate_schema(data, schema):
    """
    Validate a dictionary against a simple schema.
    Supported types: 'object', 'array', 'string', 'integer', 'number', 'boolean'.
    """
    if not isinstance(data, dict):
        raise ValidationError("Data must be a dictionary/object")

    # Required fields
    required = schema.get('required', [])
    for field in required:
        if field not in data or data[field] in (None, ""):
            raise ValidationError(f"Missing required field: {field}")

    # Properties
    properties = schema.get('properties', {})
    for field, val in data.items():
        if field in properties:
            prop_schema = properties[field]
            expected_type = prop_schema.get('type')
            
            if expected_type == 'string':
                if not isinstance(val, str):
                    raise ValidationError(f"Field '{field}' must be a string")
            elif expected_type == 'integer':
                try:
                    int(val)
                except (ValueError, TypeError):
                    raise ValidationError(f"Field '{field}' must be an integer")
            elif expected_type == 'number':
                try:
                    float(val)
                except (ValueError, TypeError):
                    raise ValidationError(f"Field '{field}' must be a number")
            elif expected_type == 'boolean':
                if not isinstance(val, bool):
                    raise ValidationError(f"Field '{field}' must be a boolean")
            elif expected_type == 'array':
                if not isinstance(val, list):
                    raise ValidationError(f"Field '{field}' must be a list/array")
                item_schema = prop_schema.get('items')
                if item_schema:
                    for item in val:
                        if item_schema.get('type') == 'object':
                            validate_schema(item, item_schema)
