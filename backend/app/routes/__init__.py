from app.routes.auth_routes import auth_bp
from app.routes.item_routes import item_bp
from app.routes.medicine_routes import medicine_bp
from app.routes.recipe_routes import recipe_bp
from app.routes.notification_routes import notification_bp
from app.routes.dashboard_routes import dashboard_bp

__all__ = [
    "auth_bp",
    "item_bp",
    "medicine_bp",
    "recipe_bp",
    "notification_bp",
    "dashboard_bp"
]
