from app.extensions import db
from app.models.user import User

class AuthService:
    @staticmethod
    def register_user(name: str, email: str, password: str):
        existing = User.query.filter_by(email=email.strip().lower()).first()
        if existing:
            return None, "Email already exists"

        user = User(
            name=name.strip(),
            email=email.strip().lower()
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()
        return user, None

    @staticmethod
    def authenticate_user(email: str, password: str):
        user = User.query.filter_by(email=email.strip().lower()).first()
        if not user or not user.check_password(password):
            return None, "Invalid email or password"
        return user, None

    @staticmethod
    def get_user_by_id(user_id: int):
        return db.session.get(User, user_id)

    @staticmethod
    def change_password(user_id: int, current_password: str, new_password: str):
        user = db.session.get(User, user_id)
        if not user:
            return False, "User not found"
        if not user.check_password(current_password):
            return False, "Incorrect current password"
        if not new_password or len(str(new_password)) < 6:
            return False, "New password must be at least 6 characters"
        user.set_password(new_password)
        db.session.commit()
        return True, "Password updated successfully"
