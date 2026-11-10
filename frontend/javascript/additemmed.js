
function formatReminderTime(raw) {
    if (!raw) return "10:00";
    let s = String(raw).trim().toUpperCase();
    const isPM = s.includes("PM");
    const isAM = s.includes("AM");
    s = s.replace(/AM|PM/g, "").trim();

    let h = 0, m = 0;
    if (s.includes(":")) {
        const parts = s.split(":");
        h = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
    } else {
        h = parseInt(s, 10);
        m = 0;
    }
    if (isNaN(h) || isNaN(m)) return "10:00";
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

﻿const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";
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

        notes: document.getElementById("notes").value,
        reminderTime: formatReminderTime(document.getElementById("reminderTime") ? document.getElementById("reminderTime").value : "10:00"),
        frequency: document.getElementById("frequency") ? document.getElementById("frequency").value : "Once Daily",
        isAlarmActive: true

    };

    fetch(`${API_BASE}/add-medicine`, {

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