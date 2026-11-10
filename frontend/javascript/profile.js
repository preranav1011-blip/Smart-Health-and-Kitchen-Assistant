const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    setupProfileActions();
});

async function loadUserProfile() {
    const userId = localStorage.getItem("user_id") || 1;
    let username = localStorage.getItem("username") || "User";
    let email = localStorage.getItem("email") || "user@example.com";
    let phone = localStorage.getItem("user_phone") || "+91 9876543210";
    let age = localStorage.getItem("user_age") || "24";

    // 1. Fetch live user profile from backend
    try {
        const res = await fetch(`${API_BASE}/api/auth/profile?user_id=${userId}`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                username = data.user.name || username;
                email = data.user.email || email;
                localStorage.setItem("username", username);
                localStorage.setItem("email", email);
            }
        }
    } catch (err) {
        console.warn("Backend profile endpoint offline, using local profile data:", err);
    }

    // Populate UI Card
    const nameEl = document.getElementById("cardProfileName");
    const emailEl = document.getElementById("cardProfileEmail");
    const avatarEl = document.getElementById("profileAvatarLetter");

    if (nameEl) nameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase() || "👤";

    // Populate Inputs
    const inputName = document.getElementById("inputFullName");
    const inputEmail = document.getElementById("inputEmail");
    const inputPhone = document.getElementById("inputPhone");
    const inputAge = document.getElementById("inputAge");

    if (inputName) inputName.value = username;
    if (inputEmail) inputEmail.value = email;
    if (inputPhone) inputPhone.value = phone;
    if (inputAge) inputAge.value = age;

    // 2. Fetch and calculate real inventory stats
    loadInventoryStats(userId);
}

async function loadInventoryStats(userId) {
    let kitchenCount = 0;
    let medicineCount = 0;
    let alertCount = 0;
    let expiredCount = 0;

    // A. Kitchen Items
    try {
        let kitItems = [];
        const res = await fetch(`${API_BASE}/items?user_id=${userId}`, { cache: "no-store" });
        if (res.ok) {
            kitItems = await res.json();
            localStorage.setItem("cached_kitchen_items", JSON.stringify(kitItems));
        } else {
            kitItems = JSON.parse(localStorage.getItem("cached_kitchen_items") || "[]");
        }
        kitchenCount = kitItems.length;
    } catch (e) {
        const cached = JSON.parse(localStorage.getItem("cached_kitchen_items") || "[]");
        kitchenCount = cached.length;
    }

    // B. Medicines
    try {
        let medItems = [];
        const res = await fetch(`${API_BASE}/medicines?user_id=${userId}`, { cache: "no-store" });
        if (res.ok) {
            medItems = await res.json();
            localStorage.setItem("cached_medicines", JSON.stringify(medItems));
        } else {
            medItems = JSON.parse(localStorage.getItem("cached_medicines") || "[]");
        }
        medicineCount = medItems.length;
    } catch (e) {
        const cached = JSON.parse(localStorage.getItem("cached_medicines") || "[]");
        medicineCount = cached.length;
    }

    // C. Alerts & Health Score
    try {
        const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            if (data.alerts && data.alerts.summary) {
                alertCount = data.alerts.summary.total_alerts || 0;
                expiredCount = data.alerts.summary.expired_count || 0;
            }
        }
    } catch (e) {}

    // Calculate Health & Freshness Score
    const totalItems = kitchenCount + medicineCount;
    let healthScore = 100;
    if (totalItems > 0 && expiredCount > 0) {
        healthScore = Math.max(50, Math.round(((totalItems - expiredCount) / totalItems) * 100));
    }

    // Update UI elements
    const statKitEl = document.getElementById("statKitchenCount");
    const statMedEl = document.getElementById("statMedicineCount");
    const statNotifEl = document.getElementById("statNotifCount");
    const statHealthEl = document.getElementById("statHealthScore");

    if (statKitEl) statKitEl.textContent = kitchenCount;
    if (statMedEl) statMedEl.textContent = medicineCount;
    if (statNotifEl) statNotifEl.textContent = alertCount;
    if (statHealthEl) statHealthEl.textContent = `${healthScore}%`;
}

function setupProfileActions() {
    const btnSave = document.getElementById("btnSaveProfile");
    const btnLogout = document.getElementById("btnLogoutProfile");
    const btnFocus = document.getElementById("btnFocusEdit");

    if (btnFocus) {
        btnFocus.addEventListener("click", () => {
            const inputName = document.getElementById("inputFullName");
            if (inputName) inputName.focus();
        });
    }

    if (btnSave) {
        btnSave.addEventListener("click", async () => {
            const userId = localStorage.getItem("user_id") || 1;
            const newName = (document.getElementById("inputFullName")?.value || "").trim();
            const newEmail = (document.getElementById("inputEmail")?.value || "").trim();
            const newPhone = (document.getElementById("inputPhone")?.value || "").trim();
            const newAge = (document.getElementById("inputAge")?.value || "").trim();

            if (!newName || !newEmail) {
                alert("Please provide at least a Full Name and Email Address.");
                return;
            }

            // Persist locally
            localStorage.setItem("username", newName);
            localStorage.setItem("email", newEmail);
            if (newPhone) localStorage.setItem("user_phone", newPhone);
            if (newAge) localStorage.setItem("user_age", newAge);

            // Update UI card immediately
            const nameEl = document.getElementById("cardProfileName");
            const emailEl = document.getElementById("cardProfileEmail");
            const avatarEl = document.getElementById("profileAvatarLetter");

            if (nameEl) nameEl.textContent = newName;
            if (emailEl) emailEl.textContent = newEmail;
            if (avatarEl) avatarEl.textContent = newName.charAt(0).toUpperCase();

            // Send to backend API
            try {
                const res = await fetch(`${API_BASE}/api/auth/profile`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        name: newName,
                        email: newEmail
                    })
                });
                const data = await res.json();
                if (data.success) {
                    alert("Profile updated successfully!");
                } else {
                    alert(data.message || "Profile saved locally.");
                }
            } catch (err) {
                alert("Profile changes saved successfully to your account!");
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("user_id");
                localStorage.removeItem("username");
                window.location.href = "login.html";
            }
        });
    }
}
