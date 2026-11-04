import json
from app.extensions import db
from app.models.recipe import Recipe
from app.models.item import KitchenItem

DEFAULT_RECIPES = [
    {
        "title": "Vegetable Omelette",
        "category": "Breakfast",
        "cooking_time": "15 mins",
        "ingredients": ["Eggs", "Onion", "Tomato", "Salt", "Oil"],
        "instructions": "Whisk eggs with chopped onion, tomato, and spices. Pour into hot oiled pan and cook until golden on both sides.",
        "image_url": "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600",
        "rating": 4.8
    },
    {
        "title": "Cheese Sandwich",
        "category": "Breakfast",
        "cooking_time": "10 mins",
        "ingredients": ["Bread", "Cheese", "Butter", "Pepper"],
        "instructions": "Butter bread slices, place cheese inside, and toast on pan until golden brown and cheese melts.",
        "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600",
        "rating": 4.5
    },
    {
        "title": "Pasta Primavera",
        "category": "Dinner",
        "cooking_time": "25 mins",
        "ingredients": ["Pasta", "Tomato", "Cheese", "Garlic", "Olive Oil"],
        "instructions": "Boil pasta. Sauté garlic and tomatoes in olive oil, toss with drained pasta and top with cheese.",
        "image_url": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600",
        "rating": 4.9
    },
    {
        "title": "Fresh Vegetable Salad",
        "category": "Healthy",
        "cooking_time": "10 mins",
        "ingredients": ["Tomato", "Cucumber", "Onion", "Lemon", "Olive Oil"],
        "instructions": "Dice fresh tomatoes, cucumbers, and onions. Dress with lemon juice, salt, and extra virgin olive oil.",
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
        "rating": 4.7
    },
    {
        "title": "Garlic Butter Toast",
        "category": "Breakfast",
        "cooking_time": "8 mins",
        "ingredients": ["Bread", "Butter", "Garlic"],
        "instructions": "Mix softened butter with minced garlic. Spread generously on bread and toast until crunchy.",
        "image_url": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600",
        "rating": 4.6
    },
    {
        "title": "Tomato Fried Rice",
        "category": "Lunch",
        "cooking_time": "20 mins",
        "ingredients": ["Rice", "Tomato", "Egg", "Onion", "Soy Sauce"],
        "instructions": "Scramble eggs, stir fry chopped tomatoes and onions, add cooked rice and sauce, toss until fragrant.",
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
        "rating": 4.7
    }
]

class RecipeService:
    @staticmethod
    def seed_default_recipes():
        if Recipe.query.first() is None:
            for item in DEFAULT_RECIPES:
                recipe = Recipe(
                    title=item["title"],
                    category=item["category"],
                    cooking_time=item["cooking_time"],
                    ingredients=json.dumps(item["ingredients"]),
                    instructions=item["instructions"],
                    image_url=item["image_url"],
                    rating=item["rating"]
                )
                db.session.add(recipe)
            db.session.commit()

    @staticmethod
    def get_all_recipes(category: str = None):
        RecipeService.seed_default_recipes()
        query = Recipe.query
        if category and category.lower() != "all":
            query = query.filter(Recipe.category.ilike(category))
        return query.all()

    @staticmethod
    def get_recommendations_for_user(user_id: int):
        RecipeService.seed_default_recipes()
        # Fetch user's current kitchen pantry item names
        user_items = KitchenItem.query.filter_by(user_id=user_id).all()
        pantry_names = set(item.name.strip().lower() for item in user_items if item.name)

        recipes = Recipe.query.all()
        recommendations = []

        for recipe in recipes:
            required = recipe.get_ingredient_list()
            matched = []
            missing = []

            for ing in required:
                ing_lower = ing.lower()
                # Check for direct or partial match in pantry
                if any(ing_lower in p or p in ing_lower for p in pantry_names):
                    matched.append(ing)
                else:
                    missing.append(ing)

            total_req = len(required) if required else 1
            match_percentage = round((len(matched) / total_req) * 100)

            rec_data = recipe.to_dict()
            rec_data["matchPercentage"] = match_percentage
            rec_data["matchedIngredients"] = matched
            rec_data["missingIngredients"] = missing
            rec_data["canCookNow"] = len(missing) == 0

            recommendations.append(rec_data)

        # Sort recommendations: highest match percentage first
        recommendations.sort(key=lambda x: (x["matchPercentage"], x["rating"]), reverse=True)
        return recommendations
