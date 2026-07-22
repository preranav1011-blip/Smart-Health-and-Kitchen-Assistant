const contentArea = document.querySelector(".content-area");
const searchInput = document.getElementById("search");
const searchBtn = document.querySelector(".search-btn");

let items = JSON.parse(localStorage.getItem("inventory")) || [];

displayItems();
updateSummary();

function displayItems(data = items) {

    contentArea.innerHTML = "";

    if (data.length === 0) {
        contentArea.innerHTML = "<p>No items found.</p>";
        return;
    }

    data.forEach((item) => {
        const status = getExpiryStatus(item.expiryDate);
        const stockStatus = getStockStatus(item.quantity);
        contentArea.innerHTML += `
        <div class="card ${status.class}">

            <div class="status-badge ${status.class}">
                ${status.badge}
            </div>

            <h3>${item.name}</h3>

            <p><strong>Category:</strong> ${item.category}</p>

            <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>

            <p><strong>Purchase:</strong> ${item.purchaseDate}</p>

            <p><strong>Expiry:</strong> ${item.expiryDate}</p>

            <p><strong>Status:</strong> ${status.text}</p>

            ${stockStatus ? `
                <div class="low-stock">
                    ${stockStatus}
                </div>
            ` : ""}

            <button class="edit-btn" onclick="editItem(${item.id})">
                Edit
            </button>

            <button class="delete-btn" onclick="deleteItem(${item.id})">
                Delete
            </button>

        </div>
        `;
    });

    document.getElementById("total-items").textContent = items.length;

    const lowStockCount = items.filter(item => item.quantity <= 2).length;
    document.getElementById("low-stock").textContent = lowStockCount;

    const expiredCount = items.filter(item =>
        getExpiryStatus(item.expiryDate).text === "Expired"
    ).length;
    document.getElementById("expired-items").textContent = expiredCount;
}

function deleteItem(id) {

    if (confirm("Delete this item?")) {

        items = items.filter(item => item.id !== id);

        localStorage.setItem("inventory", JSON.stringify(items));

        displayItems();
        updateSummary();
    }
}

function editItem(id) {

    let item = items.find(item => item.id === id);

    let newName = prompt("Enter Item Name", item.name);

    if (newName === null) return;

    let newQuantity = prompt("Enter Quantity", item.quantity);

    if (newQuantity === null) return;

    item.name = newName;
    item.quantity = newQuantity;

    localStorage.setItem("inventory", JSON.stringify(items));

    displayItems();
    updateSummary();
}

searchBtn.addEventListener("click", function () {

    const text = searchInput.value.toLowerCase();

    const filteredItems = items.filter(item =>

        item.name.toLowerCase().includes(text) ||

        item.category.toLowerCase().includes(text) ||

        item.expiryDate.includes(text)
    );

    displayItems(filteredItems);

});

searchInput.addEventListener("keyup", function () {

    const text = searchInput.value.toLowerCase();

    const filteredItems = items.filter(item =>

        item.name.toLowerCase().includes(text) ||

        item.category.toLowerCase().includes(text) ||

        item.expiryDate.includes(text)
    );

    displayItems(filteredItems);

});

function updateSummary() {

    const totalItems = items.length;

    let lowStock = 0;
    let expiredItems = 0;

    const today = new Date();

    // Remove time part so today's items aren't marked expired
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {

        // Low stock (2 or fewer)
        if (Number(item.quantity) <= 2) {
            lowStock++;
        }

        // Expired
        const expiry = new Date(item.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (!isNaN(expiry) && expiry < today) {
            expiredItems++;
        }
    });

    document.getElementById("total-items").textContent = totalItems;
    document.getElementById("low-stock").textContent = lowStock;
    document.getElementById("expired-items").textContent = expiredItems;
}

function getExpiryStatus(expiryDate) {

    const today = new Date();
    today.setHours(0,0,0,0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0,0,0,0);

    const diff = expiry - today;
    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return {
            text: "Expired",
            class: "expired",
            badge: "Expired"
        };
    }

    if (daysLeft <= 3) {
        return {
            text: `${daysLeft} day(s) left`,
            class: "danger",
            badge: "Critical"
        };
    }

    if (daysLeft <= 7) {
        return {
            text: `${daysLeft} day(s) left`,
            class: "warning",
            badge: "Expiring Soon"
        };
    }

    return {
        text: `${daysLeft} day(s) left`,
        class: "safe",
        badge: "Fresh"
    };
}

function getStockStatus(quantity) {
    if (quantity <= 2) {
        return "Low Stock";
    }
    return "";
}