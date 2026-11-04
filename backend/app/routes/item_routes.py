from flask import Blueprint, request, jsonify
from app.services.item_service import ItemService
from app.schemas.validators import validate_kitchen_item_data

item_bp = Blueprint("items", __name__)

# --- RESTful API Routes ---

@item_bp.route("/api/items", methods=["GET"])
def get_items():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id query parameter is required"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "user_id must be an integer"}), 400

    search = request.args.get("search")
    category = request.args.get("category")

    items = ItemService.get_items_by_user(user_id=user_id, search=search, category=category)
    return jsonify({
        "success": True,
        "count": len(items),
        "data": [item.to_dict() for item in items]
    }), 200


@item_bp.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = ItemService.get_item_by_id(item_id)
    if not item:
        return jsonify({"success": False, "message": "Item not found"}), 404
    return jsonify({"success": True, "data": item.to_dict()}), 200


@item_bp.route("/api/items", methods=["POST"])
def create_item():
    data = request.get_json(silent=True)
    errors = validate_kitchen_item_data(data, is_update=False)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    item = ItemService.create_item(user_id=int(data["user_id"]), data=data)
    return jsonify({
        "success": True,
        "message": "Item created successfully",
        "data": item.to_dict()
    }), 201


@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item_api(item_id):
    data = request.get_json(silent=True)
    errors = validate_kitchen_item_data(data, is_update=True)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    item = ItemService.update_item(item_id=item_id, data=data)
    if not item:
        return jsonify({"success": False, "message": "Item not found"}), 404

    return jsonify({
        "success": True,
        "message": "Item updated successfully",
        "data": item.to_dict()
    }), 200


@item_bp.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item_api(item_id):
    deleted = ItemService.delete_item(item_id)
    if not deleted:
        return jsonify({"success": False, "message": "Item not found"}), 404

    return jsonify({
        "success": True,
        "message": "Item deleted successfully"
    }), 200


# --- Legacy Routes for Full Backward-Compatibility ---

@item_bp.route("/items", methods=["GET"])
def legacy_get_items():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify([])
    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify([])

    items = ItemService.get_items_by_user(user_id)
    return jsonify([item.to_dict() for item in items])


@item_bp.route("/add-item", methods=["POST"])
def legacy_add_item():
    data = request.get_json(silent=True) or {}
    if not data.get("name") or "user_id" not in data:
        return jsonify({"message": "Name and user_id are required"}), 400

    ItemService.create_item(int(data["user_id"]), data)
    return jsonify({"message": "Item added successfully"}), 200


@item_bp.route("/delete-item/<int:item_id>", methods=["DELETE"])
def legacy_delete_item(item_id):
    deleted = ItemService.delete_item(item_id)
    if not deleted:
        return jsonify({"message": "Item not found"}), 404
    return jsonify({"message": "Item deleted successfully"}), 200


@item_bp.route("/update-item/<int:item_id>", methods=["PUT"])
def legacy_update_item(item_id):
    data = request.get_json(silent=True) or {}
    item = ItemService.update_item(item_id, data)
    if not item:
        return jsonify({"message": "Item not found"}), 404
    return jsonify({"message": "Item updated successfully"}), 200
