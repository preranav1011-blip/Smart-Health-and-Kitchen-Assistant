const medicineForm = document.getElementById("medicineForm");

const today = new Date().toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        window.location.href = "login.html";
    }

});

document.getElementById("expiryDate").min = today;

document.getElementById("purchaseDate").max = today;

medicineForm.addEventListener("submit", function(e){

    e.preventDefault();

    const purchase = new Date(document.getElementById("purchaseDate").value);
    const expiry = new Date(document.getElementById("expiryDate").value);

    if (expiry < purchase) {

        alert("Expiry date cannot be before Purchase date.");

        return;

    }

    const medicine = {

        user_id: localStorage.getItem("user_id"),

        medicineName: document.getElementById("medicineName").value,

        medicineType: document.getElementById("medicineType").value,

        brandName: document.getElementById("brandName").value,

        quantity: document.getElementById("quantity").value,

        dosage: document.getElementById("dosage").value,

        purchaseDate: document.getElementById("purchaseDate").value,

        expiryDate: document.getElementById("expiryDate").value,

        location: document.getElementById("location").value,

        prescription: document.getElementById("prescription").value,

        lowStock: document.getElementById("lowStock").value,

        notes: document.getElementById("notes").value

    };

    fetch("http://https://smart-health-and-kitchen-assistant.onrender.com/add-medicine", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(medicine)

    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);

        window.location.href = "med.html";

    })
    .catch(error => {

        console.error(error);

        alert("Failed to save medicine.");

    });     

});