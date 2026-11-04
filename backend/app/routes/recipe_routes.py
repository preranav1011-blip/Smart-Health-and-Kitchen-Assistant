from flask import Blueprint, request, jsonify
from app.services.recipe_service import RecipeService
from app.models.recipe import Recipe

recipe_bp = Blueprint("recipes", __name__)

@recipe_bp.route("/api/recipes", methods=["GET"])
def get_recipes():
    category = request.args.get("category")
    recipes = RecipeService.get_all_recipes(category=category)
    return jsonify({
        "success": True,
        "count": len(recipes),
        "data": [r.to_dict() for r in recipes]
    }), 200


@recipe_bp.route("/api/recipes/recommendations", methods=["GET"])
def get_recommendations():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "user_id query parameter is required"}), 400

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"success": False, "message": "user_id must be an integer"}), 400

    recommendations = RecipeService.get_recommendations_for_user(user_id)
    return jsonify({
        "success": True,
        "user_id": user_id,
        "count": len(recommendations),
        "data": recommendations
    }), 200


@recipe_bp.route("/api/recipes/<int:recipe_id>", methods=["GET"])
def get_recipe_detail(recipe_id):
    from app.extensions import db
    recipe = db.session.get(Recipe, recipe_id)
    if not recipe:
        return jsonify({"success": False, "message": "Recipe not found"}), 404
    return jsonify({
        "success": True,
        "data": recipe.to_dict()
    }), 200


@recipe_bp.route("/api/recipes/ai-generate", methods=["POST"])
def ai_generate_recipe():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", 1)
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        user_id = 1

    selected_ingredients = data.get("ingredients", [])
    preference = data.get("preference", "balanced")
    meal_type = data.get("meal_type", "Dinner")

    recipe = RecipeService.generate_ai_recipe(
        user_id=user_id,
        selected_ingredients=selected_ingredients,
        preference=preference,
        meal_type=meal_type
    )

    return jsonify({
        "success": True,
        "message": "AI recipe generated successfully!",
        "recipe": recipe
    }), 201
