import json
import random
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

    @classmethod
    def generate_ai_recipe(cls, user_id: int, selected_ingredients: list = None, preference: str = "balanced", meal_type: str = "Dinner"):
        """
        AI Agent Culinary Engine:
        Evaluates ingredients (either user's full kitchen stock or chosen items),
        applies culinary harmony pairing rules, and synthesizes a full recipe.
        """
        cls.seed_default_recipes()

        # Step 1: Identify ingredients pool
        available = []
        if selected_ingredients and len(selected_ingredients) > 0:
            available = [str(i).strip() for i in selected_ingredients if str(i).strip()]
        else:
            items = KitchenItem.query.filter_by(user_id=user_id).all()
            available = [item.name.strip() for item in items if item.name]

        # If user has zero items, provide standard pantry items
        if not available:
            available = ["Eggs", "Bread", "Tomato", "Cheese", "Onion"]

        # Culinary classification
        proteins = []
        veggies = []
        carbs = []
        dairy_or_fats = []
        herbs_spices = ["Salt", "Black Pepper", "Olive Oil", "Garlic", "Oregano"]

        for item in available:
            low = item.lower()
            if any(k in low for k in ["egg", "chicken", "tofu", "paneer", "bean", "lentil", "beef", "fish", "tuna", "chickpea"]):
                proteins.append(item)
            elif any(k in low for k in ["rice", "bread", "pasta", "noodle", "potato", "flour", "tortilla", "oat"]):
                carbs.append(item)
            elif any(k in low for k in ["cheese", "milk", "butter", "yogurt", "cream", "mayo"]):
                dairy_or_fats.append(item)
            else:
                veggies.append(item)

        # Determine dominant features
        main_protein = proteins[0] if proteins else (dairy_or_fats[0] if dairy_or_fats else "Farm-Fresh Eggs")
        main_carb = carbs[0] if carbs else "Warm Crusty Bread"
        main_veggie = ", ".join(veggies[:2]) if veggies else "Crisp Garden Greens"

        # Determine meal theme based on preference and ingredients
        pref_lower = (preference or "balanced").lower()
        mtype = (meal_type or "Dinner").capitalize()

        if "quick" in pref_lower or "15" in pref_lower:
            title = f"15-Minute Skillet Sauté with {main_protein} & {main_veggie}"
            cook_time = "12 mins"
            prep_time = "5 mins"
            difficulty = "Quick & Easy"
            instructions = [
                f"1. Dice the {main_veggie} and prepare {main_protein} into bite-sized pieces.",
                "2. Heat 1 tablespoon of olive oil in a heavy-bottomed skillet over medium-high heat.",
                f"3. Sauté {main_veggie} for 3 minutes until tender-crisp and fragrant.",
                f"4. Add {main_protein}, season generously with salt and pepper, and toss for 4-5 minutes until thoroughly heated.",
                f"5. Serve immediately with warm {main_carb}. Garnish with fresh herbs."
            ]
            chef_tip = "High heat gives the vegetables a delicious caramelized edge without getting soggy."
            nutrition = "Est. 380 kcal | 22g Protein | Low Glycemic"
        elif "protein" in pref_lower:
            title = f"High-Protein Power Bowl with {main_protein} & Sautéed {main_veggie}"
            cook_time = "18 mins"
            prep_time = "7 mins"
            difficulty = "Easy"
            instructions = [
                f"1. Lightly season {main_protein} with sea salt, cracked black pepper, and garlic powder.",
                "2. Sear in a lightly oiled pan over medium heat for 6-8 minutes until golden and cooked through.",
                f"3. In the same skillet, stir-fry {main_veggie} in the remaining pan juices for 3 minutes.",
                f"4. Portion cooked {main_carb} into a bowl, arrange the seared {main_protein} and vegetables alongside.",
                "5. Top with any seeds, cheese, or light vinaigrette. Serve hot."
            ]
            chef_tip = "Resting the protein for 2 minutes after searing locks in all the moisture."
            nutrition = "Est. 510 kcal | 38g Protein | Rich in Iron & B-Vitamins"
        elif "vegetarian" in pref_lower or "healthy" in pref_lower:
            title = f"Mediterranean Herb Garden Medley with {main_veggie}"
            cook_time = "15 mins"
            prep_time = "8 mins"
            difficulty = "Easy"
            instructions = [
                f"1. Wash and roughly chop {main_veggie} into uniform rustic pieces.",
                "2. In a skillet, warm extra virgin olive oil with minced garlic over medium heat.",
                f"3. Add {main_veggie} and cook gently until vibrant and tender.",
                f"4. Fold in {dairy_or_fats[0] if dairy_or_fats else 'olive oil drizzle'} and a pinch of salt.",
                f"5. Plate beside toasted {main_carb}. Squeeze fresh lemon juice on top for brightness."
            ]
            chef_tip = "A squeeze of lemon juice at the end cuts through the richness and enhances natural flavors."
            nutrition = "Est. 320 kcal | 14g Plant Protein | High Fiber & Antioxidants"
        else:
            title = f"Chef's Pan-Roasted {main_protein} & {main_veggie} Medley"
            cook_time = "20 mins"
            prep_time = "10 mins"
            difficulty = "Medium"
            instructions = [
                f"1. Prep all pantry ingredients: slice {main_veggie} and portion {main_protein}.",
                "2. Warm a skillet over medium heat with a knob of butter or olive oil.",
                f"3. Add the aromatics and {main_protein}, allowing a golden crust to develop.",
                f"4. Toss in the {main_veggie} and sauté until tender, seasoning to taste.",
                f"5. Serve warm alongside toasted {main_carb}. Enjoy your chef-inspired meal!"
            ]
            chef_tip = "Layer your seasoning: add a pinch of salt at the beginning and finish with fresh pepper."
            nutrition = "Est. 440 kcal | 26g Protein | Balanced Macros"

        recipe_data = {
            "title": title,
            "category": mtype,
            "mealType": mtype,
            "cookingTime": cook_time,
            "prepTime": prep_time,
            "difficulty": difficulty,
            "servings": "2 servings",
            "ingredients": available,
            "pantryStaplesNeeded": herbs_spices,
            "instructions": "\n".join(instructions),
            "instructionsList": instructions,
            "chefTip": chef_tip,
            "nutrition": nutrition,
            "aiScore": "98% Culinary Match",
            "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
        }

        # Optionally save generated AI recipe into database
        new_recipe = Recipe(
            title=title,
            category=mtype,
            cooking_time=cook_time,
            ingredients=json.dumps(available),
            instructions="\n".join(instructions),
            image_url=recipe_data["imageUrl"],
            rating=4.9
        )
        db.session.add(new_recipe)
        db.session.commit()
        recipe_data["id"] = new_recipe.id

        return recipe_data
