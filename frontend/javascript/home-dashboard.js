const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

let globalKitchenItems = [];
let globalMedicines = [];
let inventoryChartInstance = null;
let expiryChartInstance = null;

window.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("user_id") || 1;
    await Promise.all([
        loadKitchenData(userId),
        loadMedicineData(userId)
    ]);
    loadDashboardCharts(userId);
});

// ---------------------
// Kitchen Dashboard
// ---------------------

async function loadKitchenData(userId) {
    try {
        const response = await fetch(`${API_URL}/items?user_id=${userId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Network response not ok");
        const items = await response.json();
        globalKitchenItems = items || [];

        const totalEl = document.getElementById("kit-total");
        if (totalEl) totalEl.textContent = globalKitchenItems.length;

        let expiring = 0;
        let expired = 0;
        let lowStock = 0;
        let critical = 0;

        const preview = document.getElementById("kitchen-preview");
        if (preview) preview.innerHTML = "";

        globalKitchenItems.forEach(item => {
            const qty = Number(item.quantity) || 0;
            if (qty <= 2) lowStock++;

            const today = new Date();
            today.setHours(0,0,0,0);

            const expiry = new Date(item.expiryDate);
            expiry.setHours(0,0,0,0);

            const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            let status = "Fresh";

            if (isNaN(daysLeft)) {
                status = "Logged";
            } else if (daysLeft < 0) {
                expired++;
                critical++;
                status = "Expired";
            } else if (daysLeft <= 2) {
                critical++;
                status = `${daysLeft} day(s) left`;
            } else if (daysLeft <= 7) {
                expiring++;
                status = `${daysLeft} day(s) left`;
            }

            if (preview && preview.children.length < 5) {
                const tagClass = status === "Expired" ? "danger" : (status.includes("day") ? "warning" : "safe");
                preview.innerHTML += `
                <li class="preview-item">
                    <span>${escapeHtml(item.name)} (${item.quantity} ${item.unit || 'units'})</span>
                    <span class="tag ${tagClass}">${status}</span>
                </li>`;
            }
        });

        const kitExpEl = document.getElementById("kit-expiring");
        if (kitExpEl) kitExpEl.textContent = expiring;

        const kitExpdEl = document.getElementById("kit-expired");
        if (kitExpdEl) kitExpdEl.textContent = expired;

        updateGlobalCounts(lowStock, critical, "kitchen");

    } catch (err) {
        console.warn("Could not load kitchen items from server, using inventory preview:", err);
        const preview = document.getElementById("kitchen-preview");
        if (preview && preview.children.length === 0) {
            preview.innerHTML = `
                <li class="preview-item">
                    <span>No kitchen items yet</span>
                    <a href="additem.html" style="color:#2e7d32; font-weight:600;">+ Add Item</a>
                </li>`;
        }
    }
}

// ---------------------
// Medicine Dashboard
// ---------------------

async function loadMedicineData(userId) {
    try {
        const response = await fetch(`${API_URL}/medicines?user_id=${userId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Network response not ok");
        const medicines = await response.json();
        globalMedicines = medicines || [];

        const totalEl = document.getElementById("med-total-skus");
        if (totalEl) totalEl.textContent = globalMedicines.length;

        let lowStock = 0;
        let critical = 0;

        const preview = document.getElementById("medicine-preview");
        if (preview) preview.innerHTML = "";

        globalMedicines.forEach(medicine => {
            const qty = Number(medicine.quantity) || 0;
            const threshold = Number(medicine.lowStock) || 2;
            if (qty <= threshold) lowStock++;

            const today = new Date();
            today.setHours(0,0,0,0);

            const expiry = new Date(medicine.expiryDate);
            expiry.setHours(0,0,0,0);

            const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            let status = "Safe";

            if (isNaN(daysLeft)) {
                status = "In Stock";
            } else if (daysLeft < 0) {
                critical++;
                status = "Expired";
            } else if (daysLeft <= 2) {
                critical++;
                status = `${daysLeft} day(s) left`;
            }

            if (preview && preview.children.length < 5) {
                const tagClass = (status === "Expired" || status.includes("day")) ? "danger" : "safe";
                const medName = medicine.medicineName || medicine.name;
                preview.innerHTML += `
                <li class="preview-item">
                    <span>${escapeHtml(medName)} (${medicine.dosage || '1 dose'})</span>
                    <span class="tag ${tagClass}">${status}</span>
                </li>`;
            }
        });

        const medLowEl = document.getElementById("med-low-stock");
        if (medLowEl) medLowEl.textContent = lowStock;

        const medCritEl = document.getElementById("med-critical");
        if (medCritEl) medCritEl.textContent = critical;

        updateGlobalCounts(lowStock, critical, "medicine");

    } catch (err) {
        console.warn("Could not load medicines from server:", err);
        const preview = document.getElementById("medicine-preview");
        if (preview && preview.children.length === 0) {
            preview.innerHTML = `
                <li class="preview-item">
                    <span>No medicines logged yet</span>
                    <a href="additemmed.html" style="color:#6366f1; font-weight:600;">+ Log Medicine</a>
                </li>`;
        }
    }
}

// ---------------------
// Combined Alerts Banner
// ---------------------

let countStore = {
    kitchenLow: 0,
    kitchenCritical: 0,
    medicineLow: 0,
    medicineCritical: 0
};

function updateGlobalCounts(low, critical, category) {
    if (category === "kitchen") {
        countStore.kitchenLow = low;
        countStore.kitchenCritical = critical;
    } else {
        countStore.medicineLow = low;
        countStore.medicineCritical = critical;
    }

    const lowStockEl = document.getElementById("total-low-stock-count");
    if (lowStockEl) lowStockEl.textContent = countStore.kitchenLow + countStore.medicineLow;

    const criticalEl = document.getElementById("total-critical-count");
    if (criticalEl) criticalEl.textContent = countStore.kitchenCritical + countStore.medicineCritical;
}

const addMedBtn = document.getElementById("addMedicineBtn");
if (addMedBtn) {
    addMedBtn.addEventListener("click", () => {
        window.location.href = "additemmed.html";
    });
}

// ---------------------
// Interactive Charts
// ---------------------

async function loadDashboardCharts(userId) {
    let chartData = null;

    try {
        const res = await fetch(`${API_URL}/api/dashboard/summary?user_id=${userId}`, { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data && json.data.charts) {
                chartData = json.data.charts;
            }
        }
    } catch (err) {
        console.warn("API chart data unavailable, computing from active inventory:", err);
    }

    // If API wasn't reachable, compute from loaded kitchen items & medicines directly
    if (!chartData) {
        chartData = computeChartsFromInventory(globalKitchenItems, globalMedicines);
    }

    renderCharts(chartData);
}

function computeChartsFromInventory(kitchenItems, medicines) {
    const kCount = (kitchenItems && kitchenItems.length) || 0;
    const mCount = (medicines && medicines.length) || 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    let fresh = 0;
    let expiring = 0;
    let critical = 0;
    let expired = 0;

    const allItems = [
        ...(kitchenItems || []).map(i => ({ name: i.name, expiry: i.expiryDate })),
        ...(medicines || []).map(m => ({ name: m.medicineName || m.name, expiry: m.expiryDate }))
    ];

    allItems.forEach(item => {
        if (!item.expiry) {
            fresh++;
            return;
        }
        const exp = new Date(item.expiry);
        exp.setHours(0,0,0,0);
        const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (isNaN(days) || days > 7) fresh++;
        else if (days >= 3) expiring++;
        else if (days >= 0) critical++;
        else expired++;
    });

    // If user has 0 items logged, show starter baseline distribution
    const inventoryBreakdown = (kCount === 0 && mCount === 0)
        ? { labels: ["Kitchen Pantry", "Medicines"], data: [1, 1] }
        : { labels: ["Kitchen Pantry", "Medicines"], data: [kCount, mCount] };

    const expiryHealth = (allItems.length === 0)
        ? {
            labels: ["Fresh (>7d)", "Expiring (3-7d)", "Critical (<=2d)", "Expired"],
            data: [0, 0, 0, 0],
            colors: ["#4CAF50", "#FF9800", "#F44336", "#9E9E9E"]
        }
        : {
            labels: ["Fresh (>7d)", "Expiring (3-7d)", "Critical (<=2d)", "Expired"],
            data: [fresh, expiring, critical, expired],
            colors: ["#4CAF50", "#FF9800", "#F44336", "#9E9E9E"]
        };

    return {
        inventory_breakdown: inventoryBreakdown,
        expiry_health: expiryHealth
    };
}

function renderCharts(charts) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded yet.");
        return;
    }

    // 1. Inventory Chart
    const invCanvas = document.getElementById("inventoryChart");
    if (invCanvas && charts.inventory_breakdown) {
        if (inventoryChartInstance) {
            inventoryChartInstance.destroy();
        }

        inventoryChartInstance = new Chart(invCanvas, {
            type: "doughnut",
            data: {
                labels: charts.inventory_breakdown.labels,
                datasets: [{
                    data: charts.inventory_breakdown.data,
                    backgroundColor: ["#2e7d32", "#6366f1"],
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { boxWidth: 14, font: { size: 12 } }
                    }
                }
            }
        });
    }

    // 2. Expiry Health Chart
    const expCanvas = document.getElementById("expiryChart");
    if (expCanvas && charts.expiry_health) {
        if (expiryChartInstance) {
            expiryChartInstance.destroy();
        }

        expiryChartInstance = new Chart(expCanvas, {
            type: "bar",
            data: {
                labels: charts.expiry_health.labels,
                datasets: [{
                    label: "Items Count",
                    data: charts.expiry_health.data,
                    backgroundColor: charts.expiry_health.colors || ["#4CAF50", "#FF9800", "#F44336", "#9E9E9E"],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, precision: 0 }
                    }
                }
            }
        });
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
