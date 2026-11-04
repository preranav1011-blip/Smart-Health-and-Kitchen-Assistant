from datetime import datetime
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
        # Support default reminder time (e.g. 08:00 AM) if none provided
        reminder_time = data.get("reminderTime") or data.get("reminder_time")
        frequency = data.get("frequency", "Once Daily")
        is_alarm_active = data.get("isAlarmActive") if "isAlarmActive" in data else data.get("is_alarm_active", True)

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
            notes=data.get("notes"),
            reminder_time=reminder_time,
            frequency=frequency,
            is_alarm_active=bool(is_alarm_active)
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
        if "reminderTime" in data or "reminder_time" in data:
            med.reminder_time = data.get("reminderTime") or data.get("reminder_time")
        if "frequency" in data and data["frequency"] is not None:
            med.frequency = data["frequency"]
        if "isAlarmActive" in data or "is_alarm_active" in data:
            val = data.get("isAlarmActive") if "isAlarmActive" in data else data.get("is_alarm_active")
            med.is_alarm_active = bool(val)

        db.session.commit()
        return med

    @staticmethod
    def mark_as_taken(medicine_id: int):
        med = db.session.get(Medicine, medicine_id)
        if not med:
            return None, "Medicine not found"

        # Decrement quantity by 1 if greater than 0
        if med.quantity > 0:
            med.quantity -= 1
        med.last_taken = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        db.session.commit()
        return med, None

    @staticmethod
    def delete_medicine(medicine_id: int):
        med = db.session.get(Medicine, medicine_id)
        if not med:
            return False
        db.session.delete(med)
        db.session.commit()
        return True
