def test_create_and_get_items(client, test_user):
    # 1. Create kitchen item via REST API
    item_payload = {
        "user_id": test_user["id"],
        "name": "Organic Tomatoes",
        "category": "Produce",
        "quantity": 5,
        "unit": "kg",
        "purchaseDate": "2026-11-01",
        "expiryDate": "2026-11-15"
    }
    create_resp = client.post("/api/items", json=item_payload)
    assert create_resp.status_code == 201
    created_data = create_resp.get_json()["data"]
    assert created_data["name"] == "Organic Tomatoes"
    assert created_data["quantity"] == 5
    item_id = created_data["id"]

    # 2. Retrieve items
    get_resp = client.get(f"/api/items?user_id={test_user['id']}")
    assert get_resp.status_code == 200
    items = get_resp.get_json()["data"]
    assert len(items) == 1
    assert items[0]["id"] == item_id

    # 3. Filter by search
    search_resp = client.get(f"/api/items?user_id={test_user['id']}&search=Tomato")
    assert search_resp.status_code == 200
    assert len(search_resp.get_json()["data"]) == 1

    # 4. Search no match
    no_match_resp = client.get(f"/api/items?user_id={test_user['id']}&search=Nonexistent")
    assert len(no_match_resp.get_json()["data"]) == 0


def test_update_and_delete_item(client, test_user):
    # Create item
    create_resp = client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Milk",
        "quantity": 2
    })
    item_id = create_resp.get_json()["data"]["id"]

    # Update item
    update_resp = client.put(f"/api/items/{item_id}", json={
        "name": "Almond Milk",
        "quantity": 3
    })
    assert update_resp.status_code == 200
    updated_data = update_resp.get_json()["data"]
    assert updated_data["name"] == "Almond Milk"
    assert updated_data["quantity"] == 3

    # Delete item
    del_resp = client.delete(f"/api/items/{item_id}")
    assert del_resp.status_code == 200
    assert del_resp.get_json()["success"] is True

    # Confirm item deleted
    get_del = client.get(f"/api/items/{item_id}")
    assert get_del.status_code == 404


def test_item_validation(client, test_user):
    # Missing name
    resp = client.post("/api/items", json={"user_id": test_user["id"]})
    assert resp.status_code == 400
    assert "Item name is required" in resp.get_json()["errors"]

    # Negative quantity
    resp2 = client.post("/api/items", json={
        "user_id": test_user["id"],
        "name": "Eggs",
        "quantity": -5
    })
    assert resp2.status_code == 400
    assert "Quantity cannot be negative" in resp2.get_json()["errors"]


def test_legacy_item_routes(client, test_user):
    # Test /add-item
    add_resp = client.post("/add-item", json={
        "user_id": test_user["id"],
        "name": "Legacy Bread",
        "category": "Bakery",
        "quantity": 1,
        "unit": "loaf",
        "purchaseDate": "2026-11-01",
        "expiryDate": "2026-11-08"
    })
    assert add_resp.status_code == 200
    assert add_resp.get_json()["message"] == "Item added successfully"

    # Test /items
    items_resp = client.get(f"/items?user_id={test_user['id']}")
    assert items_resp.status_code == 200
    items = items_resp.get_json()
    assert len(items) >= 1
    assert items[0]["name"] == "Legacy Bread"
