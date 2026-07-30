import sqlite3

conn = sqlite3.connect("database.db")

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS kitchen_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER,
    unit TEXT,
    purchase_date TEXT,
    expiry_date TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicineName TEXT NOT NULL,
    medicineType TEXT,
    brandName TEXT,
    quantity INTEGER,
    dosage TEXT,
    purchaseDate TEXT,
    expiryDate TEXT,
    location TEXT,
    prescription TEXT,
    lowStock INTEGER,
    notes TEXT
)
""")

conn.commit()
conn.close()

print("Database created successfully!")

