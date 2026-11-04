from flask import Blueprint, request, jsonify
from app.services.medicine_service import MedicineService
from app.schemas.validators import validate_medicine_data

medicine_bp = Blueprint("medicines", __name__)

# --- RESTful API Routes ---

@medicine_bp.route("/api/medicines", methods=["GET"])
def get_medicines():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id query parameter is required"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "user_id must be an integer"}), 400

    search = request.args.get("search")
    medicines = MedicineService.get_medicines_by_user(user_id=user_id, search=search)
    return jsonify({
        "success": True,
        "count": len(medicines),
        "data": [med.to_dict() for med in medicines]
    }), 200


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["GET"])
def get_medicine(medicine_id):
    med = MedicineService.get_medicine_by_id(medicine_id)
    if not med:
        return jsonify({"success": False, "message": "Medicine not found"}), 404
    return jsonify({"success": True, "data": med.to_dict()}), 200


@medicine_bp.route("/api/medicines", methods=["POST"])
def create_medicine():
    data = request.get_json(silent=True)
    errors = validate_medicine_data(data, is_update=False)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    med = MedicineService.create_medicine(user_id=int(data["user_id"]), data=data)
    return jsonify({
        "success": True,
        "message": "Medicine created successfully",
        "data": med.to_dict()
    }), 201


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["PUT"])
def update_medicine_api(medicine_id):
    data = request.get_json(silent=True)
    errors = validate_medicine_data(data, is_update=True)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400

    med = MedicineService.update_medicine(medicine_id=medicine_id, data=data)
    if not med:
        return jsonify({"success": False, "message": "Medicine not found"}), 404

    return jsonify({
        "success": True,
        "message": "Medicine updated successfully",
        "data": med.to_dict()
    }), 200


@medicine_bp.route("/api/medicines/<int:medicine_id>", methods=["DELETE"])
def delete_medicine_api(medicine_id):
    deleted = MedicineService.delete_medicine(medicine_id)
    if not deleted:
        return jsonify({"success": False, "message": "Medicine not found"}), 404

    return jsonify({
        "success": True,
        "message": "Medicine deleted successfully"
    }), 200


@medicine_bp.route("/api/medicines/<int:medicine_id>/take", methods=["POST"])
def take_medicine_api(medicine_id):
    med, error = MedicineService.mark_as_taken(medicine_id)
    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({
        "success": True,
        "message": f"Dose logged! Taken {med.medicine_name}.",
        "data": med.to_dict()
    }), 200


# --- Legacy Routes for Backward-Compatibility ---

@medicine_bp.route("/medicines", methods=["GET"])
def legacy_get_medicines():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify([])
    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify([])

    medicines = MedicineService.get_medicines_by_user(user_id)
    return jsonify([med.to_dict() for med in medicines])


@medicine_bp.route("/add-medicine", methods=["POST"])
def legacy_add_medicine():
    data = request.get_json(silent=True) or {}
    med_name = data.get("medicineName") or data.get("medicine_name")
    if not med_name or "user_id" not in data:
        return jsonify({"message": "medicineName and user_id are required"}), 400

    MedicineService.create_medicine(int(data["user_id"]), data)
    return jsonify({"message": "Medicine added successfully"}), 200


@medicine_bp.route("/delete-medicine/<int:medicine_id>", methods=["DELETE"])
def legacy_delete_medicine(medicine_id):
    deleted = MedicineService.delete_medicine(medicine_id)
    if not deleted:
        return jsonify({"message": "Medicine not found"}), 404
    return jsonify({"message": "Medicine deleted successfully"}), 200


@medicine_bp.route("/update-medicine/<int:medicine_id>", methods=["PUT"])
def legacy_update_medicine(medicine_id):
    data = request.get_json(silent=True) or {}
    med = MedicineService.update_medicine(medicine_id, data)
    if not med:
        return jsonify({"message": "Medicine not found"}), 404
    return jsonify({"message": "Medicine updated successfully"}), 200
