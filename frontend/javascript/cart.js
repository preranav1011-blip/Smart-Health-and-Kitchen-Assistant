const items = JSON.parse(localStorage.getItem("inventory")) || [];

const cartContainer = document.getElementById("cart-items");

const cartItems = items.filter(item => item.quantity <= 2);

if (cartItems.length === 0) {

    cartContainer.innerHTML = `
        <h3 style="text-align:center; color:#666;">
            🎉 Everything is well stocked!
        </h3>
    `;

}

else {

    cartItems.forEach(item => {

        cartContainer.innerHTML += `
            <div class="item">

                <input type="checkbox" class="purchase-check">

                <div class="details">
                    <h3>${item.name}</h3>

                    <p>
                        Quantity Left:
                        ${item.quantity} ${item.unit}
                    </p>
                </div>

                <span class="priority high">
                    Low Stock
                </span>

            </div>
        `;

    });

}

document.getElementById("total-items").textContent = cartItems.length;

document.getElementById("low-stock-items").textContent = cartItems.length;

document.getElementById("purchased-items").textContent = 0;

const checkboxes = document.querySelectorAll(".purchase-check");

let purchasedCount = 0;

checkboxes.forEach(box => {

    box.addEventListener("change", function () {

        const item = this.closest(".item");

        if (this.checked) {

            purchasedCount++;
            item.classList.add("completed");

        } else {

            purchasedCount--;
            item.classList.remove("completed");

        }

        document.getElementById("purchased-items").textContent = purchasedCount;

    });

});