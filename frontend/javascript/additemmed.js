const medicineForm = document.getElementById("medicineForm");

const today = new Date().toISOString().split("T")[0];

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

    const medicines =
        JSON.parse(localStorage.getItem("medicines")) || [];

    const medicine = {

        id: Date.now(),

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

    medicines.push(medicine);

    localStorage.setItem("medicines", JSON.stringify(medicines));

    alert("Medicine Saved Successfully");

    window.location.href="med.html";

});