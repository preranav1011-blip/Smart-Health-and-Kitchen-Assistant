const contentArea = document.querySelector(".content-area");
const searchInput = document.getElementById("search");
const searchBtn = document.querySelector(".search-btn");

document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        window.location.href = "login.html";
    }

});

document.getElementById("addMedicineBtn").addEventListener("click", () => {
    window.location.href = "additemmed.html";
});

let medicines = [];

const userId = localStorage.getItem("user_id");

fetch(`https://smart-health-and-kitchen-assistant.onrender.com/medicines?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {

        medicines = data;

        displayMedicines();

        updateSummary();

    })
    .catch(error => {

        console.error(error);

    });

function displayMedicines(data = medicines){

    contentArea.innerHTML = "";

    if(data.length===0){
        contentArea.innerHTML="<p>No medicines found.</p>";
        return;
    }

    data.forEach((medicine)=>{

        const status = getExpiryStatus(medicine.expiryDate);
        const stockStatus = getStockStatus(medicine.quantity);

        contentArea.innerHTML +=`

        <div class="card ${status.class}">

            <div class="status-badge ${status.class}">
                ${status.badge}
            </div>

            <h3>${medicine.medicineName}</h3>

            <p><strong>Type:</strong> ${medicine.medicineType}</p>

            <p><strong>Brand:</strong> ${medicine.brandName}</p>

            <p><strong>Dosage:</strong> ${medicine.dosage}</p>

            <p><strong>Quantity:</strong> ${medicine.quantity} Units</p>

            <p><strong>Purchase:</strong> ${medicine.purchaseDate}</p>

            <p><strong>Expiry:</strong> ${medicine.expiryDate}</p>

            <p><strong>Location:</strong> ${medicine.location}</p>

            <p><strong>Prescription:</strong> ${medicine.prescription}</p>

            <p><strong>Notes:</strong> ${medicine.notes}</p>

            <p><strong>Status:</strong> ${status.text}</p>

            ${
                stockStatus ?
                `<div class="low-stock">${stockStatus}</div>`
                :
                ""
            }

            <button class="edit-btn" onclick="editMedicine(${medicine.id})">
                Edit
            </button>

            <button class="delete-btn" onclick="deleteMedicine(${medicine.id})">
                Delete
            </button>

        </div>

        `;

    });

}

function deleteMedicine(id){

    if(confirm("Delete this medicine?")){

        fetch(`https://smart-health-and-kitchen-assistant.onrender.com/delete-medicine/${id}`,{

            method:"DELETE"

        })
        .then(response=>response.json())
        .then(data=>{

            alert(data.message);

            medicines = medicines.filter(medicine=>medicine.id!==id);

            displayMedicines();

            updateSummary();

        })
        .catch(error=>{

            console.error(error);

            alert("Failed to delete medicine.");

        });

    }

}

function editMedicine(id){

    let medicine = medicines.find(medicine => medicine.id === id);

    let newName = prompt("Medicine Name", medicine.medicineName);

    if (newName === null) return;

    if (newName.trim() === "") {
        alert("Medicine name cannot be empty.");
        return;
    }

    let newType = prompt("Medicine Type", medicine.medicineType);
    if (newType === null) return;

    let newPurchase = prompt("Purchase Date (YYYY-MM-DD)", medicine.purchaseDate);
    if (newPurchase === null) return;

    let newBrand = prompt("Brand Name", medicine.brandName);
    if(newBrand === null) return;

    let newDosage = prompt("Dosage", medicine.dosage);
    if(newDosage === null) return;

    let newQuantity = prompt("Quantity", medicine.quantity);

    if (newQuantity === null) return;

    if (isNaN(newQuantity) || Number(newQuantity) <= 0) {
        alert("Quantity must be a positive number.");
        return;
    }

    let newExpiry = prompt("Expiry Date (YYYY-MM-DD)", medicine.expiryDate);

    if (newExpiry === null) return;

    const expiry = new Date(newExpiry);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (isNaN(expiry.getTime())) {
        alert("Enter a valid date in YYYY-MM-DD format.");
        return;
    }

    expiry.setHours(0,0,0,0);

    if (expiry < today) {
        alert("Expiry date cannot be in the past.");
        return;
    }

    let newLocation = prompt("Location", medicine.location);
    if(newLocation === null) return;

    let newLowStock = prompt("Low Stock Alert", medicine.lowStock);

    if (newLowStock === null) return;

    if (isNaN(newLowStock) || Number(newLowStock) <= 0) {
        alert("Low Stock Alert must be a positive number.");
        return;
    }

    let newPrescription = prompt("Prescription Required? (Yes/No)", medicine.prescription);
    if(newPrescription === null) return;

    let newNotes = prompt("Notes", medicine.notes);
    if(newNotes === null) return;

    medicine.medicineName = newName.trim();
    medicine.medicineType = newType.trim();
    medicine.purchaseDate = newPurchase;
    medicine.brandName = newBrand.trim();
    medicine.dosage = newDosage.trim();
    medicine.quantity = Number(newQuantity);
    medicine.expiryDate = newExpiry;
    medicine.location = newLocation;
    medicine.lowStock = Number(newLowStock);
    medicine.prescription = newPrescription;
    medicine.notes = newNotes.trim();

    fetch(`https://smart-health-and-kitchen-assistant.onrender.com/update-medicine/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(medicine)

    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);

        displayMedicines();

        updateSummary();

    })
    .catch(error => {

        console.error(error);

        alert("Failed to update medicine.");

    });

}

searchBtn.addEventListener("click", function () {

    const text = searchInput.value.toLowerCase();

    const filteredMedicines = medicines.filter(medicine =>

        medicine.medicineName.toLowerCase().includes(text) ||

        medicine.brandName.toLowerCase().includes(text) ||

        medicine.medicineType.toLowerCase().includes(text) ||

        medicine.location.toLowerCase().includes(text) ||

        medicine.expiryDate.includes(text)

    );

    displayMedicines(filteredMedicines);

});


searchInput.addEventListener("keyup", function () {

    const text = searchInput.value.toLowerCase();

    const filteredMedicines = medicines.filter(medicine =>

        medicine.medicineName.toLowerCase().includes(text) ||

        medicine.brandName.toLowerCase().includes(text) ||

        medicine.medicineType.toLowerCase().includes(text) ||

        medicine.location.toLowerCase().includes(text) ||

        medicine.expiryDate.includes(text)

    );

    displayMedicines(filteredMedicines);

});

function getExpiryStatus(expiryDate) {

    const today = new Date();
    today.setHours(0,0,0,0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0,0,0,0);

    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return {
            text: "Expired",
            class: "expired",
            badge: "Expired"
        };
    }
    else if (daysLeft <= 2) {
        return {
            text: `${daysLeft} day(s) left`,
            class: "danger",
            badge: "Critical"
        };
    }
    else if (daysLeft <= 30) {
        return {
            text: `${daysLeft} day(s) left`,
            class: "warning",
            badge: "Expiring Soon"
        };
    }
    else {
        return {
            text: `${daysLeft} day(s) left`,
            class: "safe",
            badge: "Safe"
        };
    }
}

function getStockStatus(quantity, lowStock){

    quantity = Number(quantity);
    lowStock = Number(lowStock);

    if(quantity <= lowStock){
        return "Low Stock";
    }

    return "";
}

function updateSummary(){

    document.getElementById("total-skus").textContent = medicines.length;

    const lowStock = medicines.filter(medicine =>
        Number(medicine.quantity) <= Number(medicine.lowStock)
    ).length;

    document.getElementById("low-stock").textContent = lowStock;

    const critical = medicines.filter(medicine =>
        getExpiryStatus(medicine.expiryDate).badge === "Critical"
    ).length;

    document.getElementById("critical-medicines").textContent = critical;

    const expiring = medicines.filter(medicine =>
        getExpiryStatus(medicine.expiryDate).badge === "Expiring Soon"
    ).length;

    document.getElementById("expiring-medicines").textContent = expiring;

    const expired = medicines.filter(medicine =>
        getExpiryStatus(medicine.expiryDate).badge==="Expired"
    ).length;

    document.getElementById("expired-medicines").textContent = expired;

    const safe = medicines.filter(medicine =>
        getExpiryStatus(medicine.expiryDate).badge==="Safe"
    ).length;

    document.getElementById("safe-medicines").textContent = safe;

    document.getElementById("controlled-substances").textContent =
        medicines.filter(medicine =>
            medicine.prescription==="Yes"
        ).length;

}

function filterMedicines(type, element){

    document.querySelectorAll(".filter-item").forEach(item=>{
        item.classList.remove("active-filter");
    });

    if(element){
        element.classList.add("active-filter");
    }

    let filtered = medicines;

    switch(type){

        case "lowstock":

            filtered = medicines.filter(medicine =>
                Number(medicine.quantity) <= Number(medicine.lowStock)
            );

            break;

        case "critical":

            filtered = medicines.filter(medicine =>
                getExpiryStatus(medicine.expiryDate).badge === "Critical"
            );

            break;

        case "expiring":

            filtered = medicines.filter(medicine =>
                getExpiryStatus(medicine.expiryDate).badge === "Expiring Soon"
            );

            break;

        case "expired":

            filtered = medicines.filter(medicine =>
                getExpiryStatus(medicine.expiryDate).badge === "Expired"
            );

            break;

        case "safe":

            filtered = medicines.filter(medicine =>
                getExpiryStatus(medicine.expiryDate).badge === "Safe"
            );

            break;

        default:

            filtered = medicines;

    }

    displayMedicines(filtered);

}