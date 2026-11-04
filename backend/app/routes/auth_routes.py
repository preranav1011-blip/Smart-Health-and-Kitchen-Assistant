from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.schemas.validators import validate_signup_data, validate_login_data

auth_bp = Blueprint("auth", __name__)

# Standard RESTful endpoints
@auth_bp.route("/api/auth/signup", methods=["POST"])
def api_signup():
    data = request.get_json(silent=True)
    errors = validate_signup_data(data)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    user, error = AuthService.register_user(
        name=data["name"],
        email=data["email"],
        password=data["password"]
    )
    if error:
        status_code = 409 if "already exists" in error else 400
        return jsonify({"success": False, "message": error}), status_code

    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True)
    errors = validate_login_data(data)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    user, error = AuthService.authenticate_user(data["email"], data["password"])
    if error:
        return jsonify({"success": False, "message": error}), 401

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }), 200


# Legacy endpoints for 100% backward compatibility with existing frontend
@auth_bp.route("/signup", methods=["POST"])
def legacy_signup():
    data = request.get_json(silent=True)
    errors = validate_signup_data(data)
    if errors:
        return jsonify({"message": errors[0]}), 400

    user, error = AuthService.register_user(
        name=data["name"],
        email=data["email"],
        password=data["password"]
    )
    if error:
        return jsonify({"message": error}), 400

    return jsonify({"message": "Signup successful"}), 200


@auth_bp.route("/login", methods=["POST"])
def legacy_login():
    data = request.get_json(silent=True)
    errors = validate_login_data(data)
    if errors:
        return jsonify({"message": errors[0]}), 400

    user, error = AuthService.authenticate_user(data["email"], data["password"])
    if error:
        return jsonify({"message": error}), 401

    return jsonify({
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name
    }), 200
