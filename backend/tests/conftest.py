import sys
import os
import pytest

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.models.user import User

@pytest.fixture(scope="session")
def app():
    _app = create_app("testing")
    with _app.app_context():
        db.create_all()
        yield _app
        db.drop_all()

@pytest.fixture(scope="function")
def client(app):
    return app.test_client()

@pytest.fixture(scope="function")
def runner(app):
    return app.test_cli_runner()

@pytest.fixture(scope="function")
def init_database(app):
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def test_user(app, init_database):
    with app.app_context():
        user = User(name="Test User", email="test@example.com")
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        return {"id": user.id, "name": user.name, "email": user.email, "password": "password123"}
