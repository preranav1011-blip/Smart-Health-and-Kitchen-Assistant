import json

def test_api_signup_success(client, init_database):
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert data["user"]["email"] == "jane@example.com"
    assert "password" not in data["user"]


def test_api_signup_duplicate_email(client, test_user):
    payload = {
        "name": "Another User",
        "email": test_user["email"],
        "password": "password123"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 409
    data = response.get_json()
    assert data["success"] is False
    assert "already exists" in data["message"].lower()


def test_api_signup_validation_failure(client, init_database):
    payload = {
        "name": "J",
        "email": "not-an-email",
        "password": "123"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert len(data["errors"]) >= 2


def test_api_login_success(client, test_user):
    payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["user_id"] == test_user["id"]
    assert data["name"] == test_user["name"]


def test_api_login_invalid_password(client, test_user):
    payload = {
        "email": test_user["email"],
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert "invalid" in data["message"].lower()


def test_legacy_auth_endpoints(client, init_database):
    # Test legacy /signup
    signup_resp = client.post("/signup", json={
        "name": "Legacy User",
        "email": "legacy@example.com",
        "password": "legacypassword123"
    })
    assert signup_resp.status_code == 200
    assert signup_resp.get_json()["message"] == "Signup successful"

    # Test legacy /login
    login_resp = client.post("/login", json={
        "email": "legacy@example.com",
        "password": "legacypassword123"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.get_json()
    assert login_data["message"] == "Login successful"
    assert "user_id" in login_data
