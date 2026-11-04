from app.extensions import db

class Medicine(db.Model):
    __tablename__ = "medicines"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_name = db.Column("medicineName", db.String(150), nullable=False)
    medicine_type = db.Column("medicineType", db.String(100), nullable=True)
    brand_name = db.Column("brandName", db.String(150), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    dosage = db.Column(db.String(100), nullable=True)
    purchase_date = db.Column("purchaseDate", db.String(50), nullable=True)
    expiry_date = db.Column("expiryDate", db.String(50), nullable=True, index=True)
    location = db.Column(db.String(150), nullable=True)
    prescription = db.Column(db.String(50), default="No")
    low_stock = db.Column("lowStock", db.Integer, default=5)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "medicineName": self.medicine_name,
            "medicine_name": self.medicine_name,
            "medicineType": self.medicine_type or "",
            "medicine_type": self.medicine_type or "",
            "brandName": self.brand_name or "",
            "brand_name": self.brand_name or "",
            "quantity": self.quantity,
            "dosage": self.dosage or "",
            "purchaseDate": self.purchase_date or "",
            "purchase_date": self.purchase_date or "",
            "expiryDate": self.expiry_date or "",
            "expiry_date": self.expiry_date or "",
            "location": self.location or "",
            "prescription": self.prescription or "No",
            "lowStock": self.low_stock if self.low_stock is not None else 5,
            "low_stock": self.low_stock if self.low_stock is not None else 5,
            "notes": self.notes or ""
        }
