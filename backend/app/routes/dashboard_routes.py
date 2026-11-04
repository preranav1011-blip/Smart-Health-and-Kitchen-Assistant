from flask import Blueprint, request, jsonify
from app.services.dashboard_service import DashboardService
from app.extensions import db

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Smart Health & Kitchen Assistant API",
        "version": "2.0.0"
    }), 200


@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "user_id must be an integer"}), 400

    summary = DashboardService.get_dashboard_summary(user_id)
    return jsonify({
        "success": True,
        "user_id": user_id,
        "data": summary
    }), 200


@dashboard_bp.route("/tables", methods=["GET"])
def get_tables():
    # Return table names for backward compatibility
    inspector = db.inspect(db.engine)
    table_names = inspector.get_table_names()
    return jsonify(table_names), 200
