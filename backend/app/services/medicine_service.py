from app.extensions import db
from app.models.medicine import Medicine

class MedicineService:
    @staticmethod
    def get_medicines_by_user(user_id: int, search: str = None):
        query = Medicine.query.filter_by(user_id=user_id)
        if search:
            query = query.filter(Medicine.medicine_name.ilike(f"%{search}%"))
        return query.order_by(Medicine.id.desc()).all()

    @staticmethod
    def get_medicine_by_id(medicine_id: int):
        return db.session.get(Medicine, medicine_id)

    @staticmethod
    def create_medicine(user_id: int, data: dict):
        medicine = Medicine(
            user_id=user_id,
            medicine_name=(data.get("medicineName") or data.get("medicine_name", "")).strip(),
            medicine_type=data.get("medicineType") or data.get("medicine_type"),
            brand_name=data.get("brandName") or data.get("brand_name"),
            quantity=int(data.get("quantity", 1)),
            dosage=data.get("dosage"),
            purchase_date=data.get("purchaseDate") or data.get("purchase_date"),
            expiry_date=data.get("expiryDate") or data.get("expiry_date"),
            location=data.get("location"),
            prescription=data.get("prescription", "No"),
            low_stock=int(data.get("lowStock") or data.get("low_stock") or 5),
            notes=data.get("notes")
        )
        db.session.add(medicine)
        db.session.commit()
        return medicine

    @staticmethod
    def update_medicine(medicine_id: int, data: dict):
        med = db.session.get(Medicine, medicine_id)
        if not med:
            return None

        if "medicineName" in data or "medicine_name" in data:
            med.medicine_name = (data.get("medicineName") or data.get("medicine_name")).strip()
        if "medicineType" in data or "medicine_type" in data:
            med.medicine_type = data.get("medicineType") or data.get("medicine_type")
        if "brandName" in data or "brand_name" in data:
            med.brand_name = data.get("brandName") or data.get("brand_name")
        if "quantity" in data and data["quantity"] is not None:
            med.quantity = int(data["quantity"])
        if "dosage" in data and data["dosage"] is not None:
            med.dosage = data["dosage"]
        if "purchaseDate" in data or "purchase_date" in data:
            med.purchase_date = data.get("purchaseDate") or data.get("purchase_date")
        if "expiryDate" in data or "expiry_date" in data:
            med.expiry_date = data.get("expiryDate") or data.get("expiry_date")
        if "location" in data and data["location"] is not None:
            med.location = data["location"]
        if "prescription" in data and data["prescription"] is not None:
            med.prescription = data["prescription"]
        if "lowStock" in data or "low_stock" in data:
            val = data.get("lowStock") if "lowStock" in data else data.get("low_stock")
            if val is not None:
                med.low_stock = int(val)
        if "notes" in data and data["notes"] is not None:
            med.notes = data["notes"]

        db.session.commit()
        return med

    @staticmethod
    def delete_medicine(medicine_id: int):
        med = db.session.get(Medicine, medicine_id)
        if not med:
            return False
        db.session.delete(med)
        db.session.commit()
        return True
