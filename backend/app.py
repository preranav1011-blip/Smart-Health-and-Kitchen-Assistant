from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

DATABASE = "database.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Smart Health & Kitchen Assistant Backend Running!"

@app.route("/items")
def get_items():

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kitchen_items")

    rows = cursor.fetchall()
    conn.close()

    items = []

    for row in rows:
        items.append({
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "quantity": row["quantity"],
            "unit": row["unit"],
            "purchaseDate": row["purchase_date"],
            "expiryDate": row["expiry_date"]
        })

    return jsonify(items)

@app.route("/add-item", methods=["POST"])
def add_item():

    data = request.get_json()

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO kitchen_items
        (name, category, quantity, unit, purchase_date, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["name"],
        data["category"],
        data["quantity"],
        data["unit"],
        data["purchaseDate"],
        data["expiryDate"]
    ))

    conn.commit()
    conn.close()

    return {"message": "Item added successfully"}

@app.route("/delete-item/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM kitchen_items WHERE id = ?",
        (item_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Item deleted successfully"
    })

@app.route("/update-item/<int:item_id>", methods=["PUT"])
def update_item(item_id):

    data = request.get_json()

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE kitchen_items
        SET
            name = ?,
            quantity = ?
        WHERE id = ?
    """, (
        data["name"],
        data["quantity"],
        item_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Item updated successfully"
    })

@app.route("/medicines")
def get_medicines():

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medicines")

    rows = cursor.fetchall()
    conn.close()

    medicines = []

    for row in rows:

        medicines.append({

            "id": row["id"],
            "medicineName": row["medicineName"],
            "medicineType": row["medicineType"],
            "brandName": row["brandName"],
            "quantity": row["quantity"],
            "dosage": row["dosage"],
            "purchaseDate": row["purchaseDate"],
            "expiryDate": row["expiryDate"],
            "location": row["location"],
            "prescription": row["prescription"],
            "lowStock": row["lowStock"],
            "notes": row["notes"]

        })

    return jsonify(medicines)

@app.route("/add-medicine", methods=["POST"])
def add_medicine():

    data = request.get_json()

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO medicines
        (
            medicineName,
            medicineType,
            brandName,
            quantity,
            dosage,
            purchaseDate,
            expiryDate,
            location,
            prescription,
            lowStock,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        data["medicineName"],
        data["medicineType"],
        data["brandName"],
        data["quantity"],
        data["dosage"],
        data["purchaseDate"],
        data["expiryDate"],
        data["location"],
        data["prescription"],
        data["lowStock"],
        data["notes"]

    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Medicine added successfully"
    })


@app.route("/delete-medicine/<int:medicine_id>", methods=["DELETE"])
def delete_medicine(medicine_id):

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM medicines WHERE id = ?",
        (medicine_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Medicine deleted successfully"
    })



@app.route("/update-medicine/<int:medicine_id>", methods=["PUT"])
def update_medicine(medicine_id):

    data = request.get_json()

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE medicines
        SET
            medicineName = ?,
            medicineType = ?,
            brandName = ?,
            quantity = ?,
            dosage = ?,
            purchaseDate = ?,
            expiryDate = ?,
            location = ?,
            prescription = ?,
            lowStock = ?,
            notes = ?
        WHERE id = ?
    """, (

        data["medicineName"],
        data["medicineType"],
        data["brandName"],
        data["quantity"],
        data["dosage"],
        data["purchaseDate"],
        data["expiryDate"],
        data["location"],
        data["prescription"],
        data["lowStock"],
        data["notes"],
        medicine_id

    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Medicine updated successfully"
    })

@app.route("/tables")
def tables():

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")

    tables = cursor.fetchall()

    conn.close()

    return jsonify(tables)


@app.route("/signup", methods=["POST"])
def signup():

    data = request.get_json()

    name = data["name"]
    email = data["email"]
    password = data["password"]

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({
            "message": "Email already exists"
        }), 400

    cursor.execute(
        """
        INSERT INTO users (name, email, password)
        VALUES (?, ?, ?)
        """,
        (name, email, password)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Signup successful"
    })


@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data["email"]
    password = data["password"]

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM users
        WHERE email = ? AND password = ?
        """,
        (email, password)
    )

    user = cursor.fetchone()

    conn.close()

    if user:
        return jsonify({
            "message": "Login successful"
        })
    else:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    
if __name__ == "__main__":
    init_db()
    app.run(debug=True)