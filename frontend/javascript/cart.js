const cartContainer = document.getElementById("cart-items");
let purchasedCount = 0;

async function loadCart() {

    try {

        const [kitchenResponse, medicineResponse] = await Promise.all([
            fetch("http://127.0.0.1:5000/items"),
            fetch("http://127.0.0.1:5000/medicines")
        ]);

        const kitchenItems = await kitchenResponse.json();
        const medicineItems = await medicineResponse.json();

        // Kitchen low stock
        const kitchenLowStock = kitchenItems
            .filter(item => Number(item.quantity) <= 2)
            .map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                type: "Kitchen"
            }));

        // Medicine low stock
        const medicineLowStock = medicineItems
            .filter(item => Number(item.quantity) <= Number(item.lowStock))
            .map(item => ({
                name: item.medicineName,
                quantity: item.quantity,
                unit: "pcs",
                type: "Medicine"
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

            cartItems.forEach(item => {

                cartContainer.innerHTML += `

                    <div class="item">

                        <input type="checkbox" class="purchase-check">

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

                    </div>

                `;

            });

        }

        document.getElementById("total-items").textContent = cartItems.length;
        document.getElementById("low-stock-items").textContent = cartItems.length;
        document.getElementById("purchased-items").textContent = purchasedCount;

        setupCheckboxes();

    }

    catch (error) {

        console.error(error);

        cartContainer.innerHTML =
            "<h3 style='color:red;text-align:center;'>Unable to load cart.</h3>";

    }

}

function setupCheckboxes() {

    document.querySelectorAll(".purchase-check").forEach(box => {

        box.addEventListener("change", function () {

            if (this.checked) {
                purchasedCount++;
                this.closest(".item").classList.add("completed");
            } else {
                purchasedCount--;
                this.closest(".item").classList.remove("completed");
            }

            document.getElementById("purchased-items").textContent = purchasedCount;

        });

    });

}

loadCart();