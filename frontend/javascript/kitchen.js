const contentArea = document.querySelector(".content-area");
const searchInput = document.getElementById("search");
const searchBtn = document.querySelector(".search-btn");

let items = JSON.parse(localStorage.getItem("inventory")) || [];

displayItems();

function displayItems(data = items) {

    contentArea.innerHTML = "";

    if (data.length === 0) {
        contentArea.innerHTML = "<p>No items found.</p>";
        return;
    }

    data.forEach((item) => {

        contentArea.innerHTML += `
            <div class="card">

                <h3>${item.name}</h3>

                <p><strong>Category:</strong> ${item.category}</p>

                <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>

                <p><strong>Purchase:</strong> ${item.purchaseDate}</p>

                <p><strong>Expiry:</strong> ${item.expiryDate}</p>

                <button class="edit-btn" onclick="editItem(items.indexOf(item))">
                    Edit
                </button>

                <button class="delete-btn" onclick="deleteItem(items.indexOf(item))">
                    Delete
                </button>

            </div>
        `;
    });
}

function deleteItem(index) {

    if (confirm("Delete this item?")) {

        items.splice(index, 1);

        localStorage.setItem("inventory", JSON.stringify(items));

        displayItems();
    }
}

function editItem(index) {

    let item = items[index];

    let newName = prompt("Enter Item Name", item.name);

    if (newName === null) return;

    let newQuantity = prompt("Enter Quantity", item.quantity);

    if (newQuantity === null) return;

    item.name = newName;
    item.quantity = newQuantity;

    localStorage.setItem("inventory", JSON.stringify(items));

    displayItems();
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