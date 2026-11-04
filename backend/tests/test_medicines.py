def test_create_and_get_medicines(client, test_user):
    payload = {
        "user_id": test_user["id"],
        "medicineName": "Paracetamol 500mg",
        "medicineType": "Tablet",
        "brandName": "Panadol",
        "quantity": 20,
        "dosage": "1 tablet twice daily",
        "purchaseDate": "2026-11-01",
        "expiryDate": "2027-11-01",
        "location": "First Aid Cabinet",
        "prescription": "No",
        "lowStock": 5,
        "notes": "Take after food"
    }

    create_resp = client.post("/api/medicines", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.get_json()["data"]
    assert created["medicineName"] == "Paracetamol 500mg"
    assert created["quantity"] == 20
    med_id = created["id"]

    # Get medicines
    get_resp = client.get(f"/api/medicines?user_id={test_user['id']}")
    assert get_resp.status_code == 200
    meds = get_resp.get_json()["data"]
    assert len(meds) == 1
    assert meds[0]["id"] == med_id


def test_update_and_delete_medicine(client, test_user):
    create_resp = client.post("/api/medicines", json={
        "user_id": test_user["id"],
        "medicineName": "Ibuprofen",
        "quantity": 10
    })
    med_id = create_resp.get_json()["data"]["id"]

    # Update
    update_resp = client.put(f"/api/medicines/{med_id}", json={
        "medicineName": "Ibuprofen 400mg",
        "quantity": 8
    })
    assert update_resp.status_code == 200
    assert update_resp.get_json()["data"]["quantity"] == 8

    # Delete
    del_resp = client.delete(f"/api/medicines/{med_id}")
    assert del_resp.status_code == 200

    # Verify 404
    assert client.get(f"/api/medicines/{med_id}").status_code == 404


def test_legacy_medicine_routes(client, test_user):
    add_resp = client.post("/add-medicine", json={
        "user_id": test_user["id"],
        "medicineName": "Cough Syrup",
        "medicineType": "Syrup",
        "brandName": "Benylin",
        "quantity": 1,
        "dosage": "10ml",
        "purchaseDate": "2026-11-01",
        "expiryDate": "2026-12-01",
        "location": "Kitchen Cabinet",
        "prescription": "No",
        "lowStock": 2,
        "notes": "Night only"
    })
    assert add_resp.status_code == 200
    assert add_resp.get_json()["message"] == "Medicine added successfully"

    get_resp = client.get(f"/medicines?user_id={test_user['id']}")
    assert get_resp.status_code == 200
    assert len(get_resp.get_json()) >= 1
