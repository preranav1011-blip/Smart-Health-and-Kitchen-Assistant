from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)

    # Relationships
    kitchen_items = db.relationship("KitchenItem", backref="user", cascade="all, delete-orphan", lazy=True)
    medicines = db.relationship("Medicine", backref="user", cascade="all, delete-orphan", lazy=True)

    def set_password(self, raw_password: str):
        self.password = generate_password_hash(raw_password)

    def check_password(self, candidate_password: str) -> bool:
        if not self.password:
            return False
        # Supports both hashed passwords and legacy plain-text passwords for smooth migration
        if self.password.startswith("scrypt:") or self.password.startswith("pbkdf2:"):
            return check_password_hash(self.password, candidate_password)
        return self.password == candidate_password

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email
        }
