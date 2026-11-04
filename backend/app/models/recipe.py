import json
from app.extensions import db

class Recipe(db.Model):
    __tablename__ = "recipes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), default="General") # Breakfast, Lunch, Dinner, Healthy, Dessert, Drinks
    cooking_time = db.Column(db.String(50), default="20 mins")
    ingredients = db.Column(db.Text, nullable=False) # JSON list or comma separated string of ingredients
    instructions = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    rating = db.Column(db.Float, default=4.5)

    def get_ingredient_list(self):
        try:
            return json.loads(self.ingredients)
        except Exception:
            return [i.strip() for i in self.ingredients.split(",") if i.strip()]

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "cookingTime": self.cooking_time,
            "ingredients": self.get_ingredient_list(),
            "instructions": self.instructions or "",
            "imageUrl": self.image_url or "",
            "rating": self.rating
        }
