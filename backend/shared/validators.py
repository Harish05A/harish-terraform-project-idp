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
