import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, cors

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    config_obj = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_obj)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.item_routes import item_bp
    from app.routes.medicine_routes import medicine_bp
    from app.routes.recipe_routes import recipe_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.dashboard_routes import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(item_bp)
    app.register_blueprint(medicine_bp)
    app.register_blueprint(recipe_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(dashboard_bp)

    # Register JSON error handlers for clean REST responses
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "message": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"success": False, "message": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    # Ensure tables are initialized
    with app.app_context():
        try:
            db.create_all()
            from app.services.recipe_service import RecipeService
            RecipeService.seed_default_recipes()
        except Exception as e:
            # Table creation may fail during testing if DB is mocked or during custom migrations
            app.logger.warning(f"Database initialization note: {e}")

    return app
