from collections import Counter
from datetime import date
from app.models.item import KitchenItem
from app.models.medicine import Medicine
from app.services.notification_service import NotificationService

class DashboardService:
    @staticmethod
    def get_dashboard_summary(user_id: int):
        kitchen_items = KitchenItem.query.filter_by(user_id=user_id).all()
        medicines = Medicine.query.filter_by(user_id=user_id).all()
        alerts = NotificationService.get_user_alerts(user_id)

        # 1. Categories Breakdown
        k_categories = Counter([item.category or "Other" for item in kitchen_items])
        m_types = Counter([med.medicine_type or "General" for med in medicines])

        # 2. Expiry status distribution
        total_items = len(kitchen_items) + len(medicines)
        expired = alerts["summary"]["expired_count"]
        expiring_soon = alerts["summary"]["expiring_soon_count"]
        healthy_count = max(0, total_items - expired - expiring_soon)

        chart_data = {
            "inventory_breakdown": {
                "labels": ["Kitchen Items", "Medicines"],
                "data": [len(kitchen_items), len(medicines)]
            },
            "expiry_health": {
                "labels": ["Fresh / Good", "Expiring Soon (<=3 days)", "Expired"],
                "data": [healthy_count, expiring_soon, expired],
                "colors": ["#4CAF50", "#FF9800", "#F44336"]
            },
            "kitchen_categories": {
                "labels": list(k_categories.keys()),
                "data": list(k_categories.values())
            },
            "medicine_types": {
                "labels": list(m_types.keys()),
                "data": list(m_types.values())
            }
        }

        return {
            "total_items": len(kitchen_items),
            "total_medicines": len(medicines),
            "low_stock_count": alerts["summary"]["low_stock_count"],
            "expired_count": expired,
            "expiring_soon_count": expiring_soon,
            "charts": chart_data
        }
