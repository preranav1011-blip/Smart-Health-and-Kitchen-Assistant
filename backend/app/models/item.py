from datetime import date
from app.extensions import db

class KitchenItem(db.Model):
    __tablename__ = "kitchen_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    category = db.Column(db.String(100), default="General")
    quantity = db.Column(db.Integer, default=1)
    unit = db.Column(db.String(50), default="units")
    purchase_date = db.Column(db.String(50), nullable=True)
    expiry_date = db.Column(db.String(50), nullable=True, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "purchaseDate": self.purchase_date or "",
            "purchase_date": self.purchase_date or "",
            "expiryDate": self.expiry_date or "",
            "expiry_date": self.expiry_date or ""
        }
