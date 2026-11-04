from datetime import date, timedelta

def test_recipe_recommendations_from_kitchen(client, test_user):
    # Add ingredients to kitchen
    client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Eggs",
        "quantity": 6
    })
    client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Tomato",
        "quantity": 3
    })

    # Get recipe recommendations
    rec_resp = client.get(f"/api/recipes/recommendations?user_id={test_user['id']}")
    assert rec_resp.status_code == 200
    data = rec_resp.get_json()
    assert data["success"] is True
    assert len(data["data"]) > 0

    # Top recommendation should have matched ingredients
    top_recipe = data["data"][0]
    assert "matchPercentage" in top_recipe
    assert "matchedIngredients" in top_recipe
    assert "missingIngredients" in top_recipe
    assert top_recipe["matchPercentage"] > 0


def test_expiry_alerts_and_dispatch(client, test_user):
    today = date.today()
    expired_date = (today - timedelta(days=2)).isoformat()
    expiring_soon_date = (today + timedelta(days=1)).isoformat()

    # Create expired item
    client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Yogurt",
        "quantity": 1,
        "expiryDate": expired_date
    })

    # Create item expiring tomorrow
    client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Fresh Milk",
        "quantity": 1,
        "expiryDate": expiring_soon_date
    })

    # Fetch alerts
    alert_resp = client.get(f"/api/notifications/alerts?user_id={test_user['id']}")
    assert alert_resp.status_code == 200
    alerts = alert_resp.get_json()["alerts"]

    assert alerts["summary"]["expired_count"] >= 1
    assert alerts["summary"]["expiring_soon_count"] >= 1
    assert alerts["summary"]["total_alerts"] >= 2

    # Test alert dispatch (email/push)
    dispatch_resp = client.post("/api/notifications/dispatch", json={
        "user_id": test_user["id"],
        "channel": "email"
    })
    assert dispatch_resp.status_code == 200
    disp_data = dispatch_resp.get_json()
    assert disp_data["success"] is True
    assert disp_data["dispatch"]["status"] == "sent"


def test_dashboard_summary_and_charts(client, test_user):
    # Add an item and a medicine
    client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Apples",
        "category": "Fruits",
        "quantity": 4
    })
    client.post("/api/medicines", json={
        "user_id": test_user["id"],
        "medicineName": "Vitamin C",
        "medicineType": "Supplements",
        "quantity": 30
    })

    resp = client.get(f"/api/dashboard/summary?user_id={test_user['id']}")
    assert resp.status_code == 200
    data = resp.get_json()["data"]

    assert data["total_items"] >= 1
    assert data["total_medicines"] >= 1
    assert "charts" in data
    assert "inventory_breakdown" in data["charts"]
    assert "expiry_health" in data["charts"]
    assert "kitchen_categories" in data["charts"]
