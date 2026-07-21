const form = document.getElementById("addItemForm");

form.addEventListener("submit", function (event) {

    event.preventDefault();

    const item = {
        id: Date.now(),
        name: document.getElementById("itemName").value,
        category: document.getElementById("category").value,
        quantity: document.getElementById("quantity").value,
        unit: document.getElementById("unit").value,
        purchaseDate: document.getElementById("purchaseDate").value,
        expiryDate: document.getElementById("expiryDate").value
    };

    let items = JSON.parse(localStorage.getItem("inventory")) || [];

    items.push(item);

    localStorage.setItem("inventory", JSON.stringify(items));

    alert("Item Added Successfully!");

    form.reset();

    window.location.href = "kit.html";
});