import re
from datetime import datetime

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

def validate_signup_data(data):
    errors = []
    if not isinstance(data, dict):
        return ["Invalid request body, expected JSON object"]
    
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not str(name).strip():
        errors.append("Name is required")
    elif len(str(name).strip()) < 2:
        errors.append("Name must be at least 2 characters")

    if not email or not str(email).strip():
        errors.append("Email is required")
    elif not EMAIL_REGEX.match(str(email).strip()):
        errors.append("Invalid email address format")

    if not password or not str(password).strip():
        errors.append("Password is required")
    elif len(str(password)) < 6:
        errors.append("Password must be at least 6 characters")

    return errors


def validate_login_data(data):
    errors = []
    if not isinstance(data, dict):
        return ["Invalid request body, expected JSON object"]

    email = data.get("email")
    password = data.get("password")

    if not email or not str(email).strip():
        errors.append("Email is required")
    if not password or not str(password).strip():
        errors.append("Password is required")

    return errors


def validate_kitchen_item_data(data, is_update=False):
    errors = []
    if not isinstance(data, dict):
        return ["Invalid request body, expected JSON object"]

    if not is_update:
        if "user_id" not in data or data.get("user_id") is None:
            errors.append("user_id is required")
        else:
            try:
                int(data["user_id"])
            except (ValueError, TypeError):
                errors.append("user_id must be an integer")

        if "name" not in data or not str(data.get("name", "")).strip():
            errors.append("Item name is required")

    if "quantity" in data and data["quantity"] is not None:
        try:
            qty = int(data["quantity"])
            if qty < 0:
                errors.append("Quantity cannot be negative")
        except (ValueError, TypeError):
            errors.append("Quantity must be a valid number")

    for date_field in ["purchaseDate", "purchase_date", "expiryDate", "expiry_date"]:
        if date_field in data and data[date_field]:
            val = str(data[date_field]).strip()
            # Basic validation of YYYY-MM-DD
            try:
                datetime.strptime(val, "%Y-%m-%d")
            except ValueError:
                errors.append(f"{date_field} must be in YYYY-MM-DD format")

    return errors


def validate_medicine_data(data, is_update=False):
    errors = []
    if not isinstance(data, dict):
        return ["Invalid request body, expected JSON object"]

    med_name = data.get("medicineName") or data.get("medicine_name")
    if not is_update:
        if "user_id" not in data or data.get("user_id") is None:
            errors.append("user_id is required")
        else:
            try:
                int(data["user_id"])
            except (ValueError, TypeError):
                errors.append("user_id must be an integer")

        if not med_name or not str(med_name).strip():
            errors.append("Medicine name is required")

    if "quantity" in data and data["quantity"] is not None:
        try:
            qty = int(data["quantity"])
            if qty < 0:
                errors.append("Quantity cannot be negative")
        except (ValueError, TypeError):
            errors.append("Quantity must be an integer")

    if "lowStock" in data and data["lowStock"] is not None:
        try:
            int(data["lowStock"])
        except (ValueError, TypeError):
            errors.append("lowStock must be an integer")

    return errors
