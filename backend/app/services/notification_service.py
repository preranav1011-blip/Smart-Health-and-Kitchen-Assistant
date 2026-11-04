from datetime import datetime, date, timedelta
from app.models.item import KitchenItem
from app.models.medicine import Medicine
from app.models.user import User

class NotificationService:
    @staticmethod
    def _parse_date(date_str):
        if not date_str:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(str(date_str).strip(), fmt).date()
            except ValueError:
                pass
        return None

    @classmethod
    def get_user_alerts(cls, user_id: int):
        today = date.today()
        warning_window = today + timedelta(days=3)

        alerts = {
            "expired_items": [],
            "expiring_soon_items": [],
            "low_stock_items": [],
            "summary": {
                "expired_count": 0,
                "expiring_soon_count": 0,
                "low_stock_count": 0,
                "total_alerts": 0
            }
        }

        # 1. Kitchen Items check
        kitchen_items = KitchenItem.query.filter_by(user_id=user_id).all()
        for item in kitchen_items:
            exp = cls._parse_date(item.expiry_date)
            if exp:
                days_left = (exp - today).days
                if days_left < 0:
                    alerts["expired_items"].append({
                        "type": "kitchen",
                        "id": item.id,
                        "name": item.name,
                        "expiryDate": item.expiry_date,
                        "status": "expired",
                        "daysOverdue": abs(days_left),
                        "message": f"Kitchen item '{item.name}' expired {abs(days_left)} days ago!"
                    })
                elif days_left <= 3:
                    alerts["expiring_soon_items"].append({
                        "type": "kitchen",
                        "id": item.id,
                        "name": item.name,
                        "expiryDate": item.expiry_date,
                        "status": "expiring_soon",
                        "daysRemaining": days_left,
                        "message": f"Kitchen item '{item.name}' expires in {days_left} day(s)!"
                    })

            if item.quantity is not None and item.quantity <= 1:
                alerts["low_stock_items"].append({
                    "type": "kitchen",
                    "id": item.id,
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "message": f"Kitchen item '{item.name}' is low in stock ({item.quantity} {item.unit} left)."
                })

        # 2. Medicine Items check
        medicines = Medicine.query.filter_by(user_id=user_id).all()
        for med in medicines:
            exp = cls._parse_date(med.expiry_date)
            if exp:
                days_left = (exp - today).days
                if days_left < 0:
                    alerts["expired_items"].append({
                        "type": "medicine",
                        "id": med.id,
                        "name": med.medicine_name,
                        "expiryDate": med.expiry_date,
                        "status": "expired",
                        "daysOverdue": abs(days_left),
                        "message": f"Medicine '{med.medicine_name}' expired {abs(days_left)} days ago!"
                    })
                elif days_left <= 3:
                    alerts["expiring_soon_items"].append({
                        "type": "medicine",
                        "id": med.id,
                        "name": med.medicine_name,
                        "expiryDate": med.expiry_date,
                        "status": "expiring_soon",
                        "daysRemaining": days_left,
                        "message": f"Medicine '{med.medicine_name}' expires in {days_left} day(s)!"
                    })

            threshold = med.low_stock if med.low_stock is not None else 5
            if med.quantity is not None and med.quantity <= threshold:
                alerts["low_stock_items"].append({
                    "type": "medicine",
                    "id": med.id,
                    "name": med.medicine_name,
                    "quantity": med.quantity,
                    "threshold": threshold,
                    "message": f"Medicine '{med.medicine_name}' is critically low ({med.quantity} left)."
                })

        alerts["summary"]["expired_count"] = len(alerts["expired_items"])
        alerts["summary"]["expiring_soon_count"] = len(alerts["expiring_soon_items"])
        alerts["summary"]["low_stock_count"] = len(alerts["low_stock_items"])
        alerts["summary"]["total_alerts"] = (
            len(alerts["expired_items"]) +
            len(alerts["expiring_soon_items"]) +
            len(alerts["low_stock_items"])
        )

        return alerts

    @classmethod
    def send_alert_dispatch(cls, user_id: int, channel: str = "email"):
        from app.extensions import db
        user = db.session.get(User, user_id)
        if not user:
            return None, "User not found"

        alerts = cls.get_user_alerts(user_id)
        total = alerts["summary"]["total_alerts"]

        if total == 0:
            return {
                "status": "skipped",
                "message": "No active alerts or expiring items at this time.",
                "recipient": user.email
            }, None

        # Simulated push/email dispatch
        subject = f"Smart Health Alert: {total} items need your attention"
        return {
            "status": "sent",
            "channel": channel,
            "recipient": user.email,
            "subject": subject,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": alerts["summary"]
        }, None
