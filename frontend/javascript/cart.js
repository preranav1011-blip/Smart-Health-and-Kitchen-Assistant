const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://smart-health-and-kitchen-assistant.onrender.com';
const cartContainer = document.getElementById("cart-items");
let purchasedCount = 0;

document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        window.location.href = "login.html";
    }

});

async function loadCart() {

    try {

        const userId = localStorage.getItem("user_id");

        const [kitchenResponse, medicineResponse] = await Promise.all([
            fetch(`${API_BASE}/items?user_id=${userId}`),
            fetch(`${API_BASE}/medicines?user_id=${userId}`)
        ]);

        const kitchenItems = await kitchenResponse.json();
        const medicineItems = await medicineResponse.json();

        // Kitchen low stock
        const kitchenLowStock = kitchenItems
            .filter(item => Number(item.quantity) <= 2)
            .map(item => ({
                id: item.id,
                name: item.name,
                quantity: Number(item.quantity),
                unit: item.unit,
                type: "Kitchen"
            }));

        // Medicine low stock
        const medicineLowStock = medicineItems
            .filter(item => Number(item.quantity) <= Number(item.lowStock))
            .map(item => ({
                id: item.id,
                name: item.medicineName,
                quantity: Number(item.quantity),
                unit: "pcs",
                type: "Medicine",

                // Keep the complete medicine information
                // because the backend update route expects it.
                medicineType: item.medicineType,
                brandName: item.brandName,
                dosage: item.dosage,
                purchaseDate: item.purchaseDate,
                expiryDate: item.expiryDate,
                location: item.location,
                prescription: item.prescription,
                lowStock: item.lowStock,
                notes: item.notes
            }));

        const cartItems = [...kitchenLowStock, ...medicineLowStock];

        cartContainer.innerHTML = "";

        if (cartItems.length === 0) {

            cartContainer.innerHTML = `
                <h3 style="text-align:center;color:#666;">
                    🎉 Everything is well stocked!
                </h3>
            `;

        } else {

            let html = "";

            cartItems.forEach(item => {

                html += `

                    <div class="item">

                        <div class="details">

                            <h3>${item.name}</h3>

                            <p>
                                <strong>${item.type}</strong><br>
                                Quantity Left:
                                ${item.quantity} ${item.unit}
                            </p>

                        </div>

                        <span class="priority high">
                            Low Stock
                        </span>

                        <button
                            class="purchase-btn"
                            onclick='purchaseItem(${JSON.stringify(item)})'>
                            ✓ Purchased
                        </button>

                    </div>

                `;

            });

            cartContainer.innerHTML = html;

        }

        document.getElementById("total-items").textContent = cartItems.length;
        document.getElementById("low-stock-items").textContent = cartItems.length;
        document.getElementById("purchased-items").textContent = purchasedCount;

    }

    catch (error) {

        console.error(error);

        cartContainer.innerHTML =
            "<h3 style='color:red;text-align:center;'>Unable to load cart.</h3>";

    }

}


// ------------------------------------------
// PURCHASE ITEM
// ------------------------------------------

async function purchaseItem(item) {

    const purchasedQuantity = prompt(
        `How many ${item.name} did you buy?`,
        "1"
    );

    // User pressed Cancel
    if (purchasedQuantity === null) {
        return;
    }

    const amount = Number(purchasedQuantity);

    // Validate quantity
    if (
        purchasedQuantity.trim() === "" ||
        !Number.isInteger(amount) ||
        amount <= 0
    ) {

        alert("Please enter a valid positive whole number.");

        return;
    }

    const newQuantity = item.quantity + amount;

    try {

        let response;

        // ------------------------------------------
        // KITCHEN ITEM
        // ------------------------------------------

        if (item.type === "Kitchen") {

            response = await fetch(
                `${API_BASE}/update-item/${item.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: item.name,
                        quantity: newQuantity
                    })
                }
            );

        }

        // ------------------------------------------
        // MEDICINE
        // ------------------------------------------

        else if (item.type === "Medicine") {

            response = await fetch(
                `${API_BASE}/update-medicine/${item.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        medicineName: item.name,
                        medicineType: item.medicineType,
                        brandName: item.brandName,
                        quantity: newQuantity,
                        dosage: item.dosage,
                        purchaseDate: item.purchaseDate,
                        expiryDate: item.expiryDate,
                        location: item.location,
                        prescription: item.prescription,
                        lowStock: item.lowStock,
                        notes: item.notes

                    })
                }
            );

        }

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Failed to update quantity.");

            return;
        }

        // Successfully purchased
        purchasedCount++;

        alert(
            `${amount} ${item.name} added to your inventory.\n\n` +
            `New quantity: ${newQuantity}`
        );

        // Reload cart
        loadCart();

    }

    catch (error) {

        console.error(error);

        alert("Failed to update inventory.");

    }

}

loadCart();