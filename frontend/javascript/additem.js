const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://smart-health-and-kitchen-assistant.onrender.com';
const form = document.getElementById("addItemForm");

document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        window.location.href = "login.html";
    }

});

form.addEventListener("submit", function (event) {

    event.preventDefault();

    const item = {
        user_id: localStorage.getItem("user_id"),
        name: document.getElementById("itemName").value,
        category: document.getElementById("category").value,
        quantity: document.getElementById("quantity").value,
        unit: document.getElementById("unit").value,
        purchaseDate: document.getElementById("purchaseDate").value,
        expiryDate: document.getElementById("expiryDate").value
    };

    fetch(`${API_BASE}/add-item`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(item)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);

        form.reset();

        window.location.href = "kit.html";
    })
    .catch(error => {
        console.error(error);
        alert("Failed to add item.");
    });
});