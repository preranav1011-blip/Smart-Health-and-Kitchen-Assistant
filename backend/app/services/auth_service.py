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
