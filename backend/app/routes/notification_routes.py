from flask import Blueprint, request, jsonify
from app.services.notification_service import NotificationService

notification_bp = Blueprint("notifications", __name__)

@notification_bp.route("/api/notifications/alerts", methods=["GET"])
def get_alerts():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "user_id must be an integer"}), 400

    alerts = NotificationService.get_user_alerts(user_id)
    return jsonify({
        "success": True,
        "user_id": user_id,
        "alerts": alerts
    }), 200


@notification_bp.route("/api/notifications/dispatch", methods=["POST"])
def dispatch_alert():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400

    channel = data.get("channel", "email") # email or push
    result, error = NotificationService.send_alert_dispatch(user_id=int(user_id), channel=channel)
    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({
        "success": True,
        "dispatch": result
    }), 200
