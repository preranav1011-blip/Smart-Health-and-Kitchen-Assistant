from app.extensions import db
from app.models.item import KitchenItem

class ItemService:
    @staticmethod
    def get_items_by_user(user_id: int, search: str = None, category: str = None):
        query = KitchenItem.query.filter_by(user_id=user_id)
        if category:
            query = query.filter_by(category=category)
        if search:
            query = query.filter(KitchenItem.name.ilike(f"%{search}%"))
        return query.order_by(KitchenItem.id.desc()).all()

    @staticmethod
    def get_item_by_id(item_id: int):
        return db.session.get(KitchenItem, item_id)

    @staticmethod
    def create_item(user_id: int, data: dict):
        item = KitchenItem(
            user_id=user_id,
            name=data.get("name", "").strip(),
            category=data.get("category", "General"),
            quantity=int(data.get("quantity", 1)),
            unit=data.get("unit", "units"),
            purchase_date=data.get("purchaseDate") or data.get("purchase_date"),
            expiry_date=data.get("expiryDate") or data.get("expiry_date")
        )
        db.session.add(item)
        db.session.commit()
        return item

    @staticmethod
    def update_item(item_id: int, data: dict):
        item = db.session.get(KitchenItem, item_id)
        if not item:
            return None

        if "name" in data and data["name"]:
            item.name = data["name"].strip()
        if "category" in data and data["category"] is not None:
            item.category = data["category"]
        if "quantity" in data and data["quantity"] is not None:
            item.quantity = int(data["quantity"])
        if "unit" in data and data["unit"] is not None:
            item.unit = data["unit"]
        if "purchaseDate" in data or "purchase_date" in data:
            item.purchase_date = data.get("purchaseDate") or data.get("purchase_date")
        if "expiryDate" in data or "expiry_date" in data:
            item.expiry_date = data.get("expiryDate") or data.get("expiry_date")

        db.session.commit()
        return item

    @staticmethod
    def delete_item(item_id: int):
        item = db.session.get(KitchenItem, item_id)
        if not item:
            return False
        db.session.delete(item)
        db.session.commit()
        return True
