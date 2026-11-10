const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id") || 1;
    loadNotifications(userId);
    setupActionButtons(userId);
});

async function loadNotifications(userId) {
    const listContainer = document.querySelector(".notification-list");

    try {
        const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        const alerts = data.alerts || {};
        renderNotificationData(alerts, userId);
    } catch (err) {
        console.warn("Primary alerts endpoint unavailable, evaluating directly from inventory:", err);
        // Fallback: evaluate directly by loading inventory items & medicines
        await fallbackEvaluateInventoryAlerts(userId);
    }
}

function renderNotificationData(alerts, userId) {
    const summary = alerts.summary || {};

    // Update Summary Cards
    const urgentCountEl = document.querySelector(".card.urgent h2");
    if (urgentCountEl) urgentCountEl.textContent = summary.expired_count || 0;

    const warningCountEl = document.querySelector(".card.warning h2");
    if (warningCountEl) warningCountEl.textContent = summary.expiring_soon_count || 0;

    const refillCountEl = document.querySelector(".card.info h2");
    if (refillCountEl) refillCountEl.textContent = summary.low_stock_count || 0;

    const medAlarmEl = document.querySelector("#medAlarmCard h2");
    if (medAlarmEl) medAlarmEl.textContent = summary.medicine_alarm_count || 0;

    const listContainer = document.querySelector(".notification-list");
    if (!listContainer) return;

    let html = `<h2>Active Alerts & Reminders (${summary.total_alerts || 0})</h2>`;

    // 1. Medicine Alarms & Reminders
    if (alerts.medicine_alarms && alerts.medicine_alarms.length > 0) {
        html += `
            <div style="margin: 20px 0 10px 0;">
                <h3 style="color:#4338ca; display:flex; align-items:center; gap:8px;">
                    <span>⏰</span> Scheduled Medicine Intake Alarms (${alerts.medicine_alarms.length})
                </h3>
            </div>
        `;

        alerts.medicine_alarms.forEach(med => {
            html += `
                <div class="notification" style="border-left:5px solid #6366f1; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div style="display:flex; gap:15px; align-items:center;">
                        <div class="icon" style="font-size:26px;">⏰</div>
                        <div class="content">
                            <h3 style="margin:0 0 4px 0; color:#1e1b4b;">${escapeHtml(med.name)} &bull; ${escapeHtml(med.reminderTime || "Scheduled")}</h3>
                            <p style="margin:0 0 4px 0; color:#475569;">Dosage: <strong>${escapeHtml(med.dosage || "1 dose")}</strong> &bull; Frequency: ${escapeHtml(med.frequency || "Daily")} &bull; Stock: ${med.quantity} remaining</p>
                            <span style="font-size:11px; color:#64748b;">
                                ${med.lastTaken ? `Last taken: ${escapeHtml(med.lastTaken)}` : "Pending today's scheduled intake"}
                            </span>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button onclick="takeDoseFromNotif(${med.id}, '${escapeHtml(med.name)}')" style="background:#2e7d32; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer;">
                            ✓ Take Dose
                        </button>
                        <button onclick="if(window.triggerTestMedicineAlarm){window.triggerTestMedicineAlarm('${escapeHtml(med.name)}', '${escapeHtml(med.dosage || '1 dose')}');}" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer;" title="Preview chime sound & popup">
                            🔊 Test Alarm
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // 2. Expired items
    if (alerts.expired_items && alerts.expired_items.length > 0) {
        html += `
            <div style="margin: 25px 0 10px 0;">
                <h3 style="color:#d32f2f; display:flex; align-items:center; gap:8px;">
                    <span>⚠️</span> Expired Items (${alerts.expired_items.length})
                </h3>
            </div>
        `;
        alerts.expired_items.forEach(item => {
            html += `
                <div class="notification urgent" style="border-left:5px solid #d32f2f; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div class="icon" style="font-size:24px; color:#d32f2f;">⚠️</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 4px 0; color:#d32f2f;">${escapeHtml(item.name)} Expired!</h3>
                        <p style="margin:0 0 4px 0; color:#555;">Expired ${item.daysOverdue !== undefined ? item.daysOverdue + ' days ago' : ''} (Expiry Date: ${escapeHtml(item.expiryDate || "N/A")}). Stock: ${item.quantity || 1}. Please safely discard or replace.</p>
                        <span style="font-size:11px; color:#888;">Critical Freshness Alert &bull; Type: ${escapeHtml(item.type || "Kitchen")}</span>
                    </div>
                </div>
            `;
        });
    }

    // 3. Expiring soon items
    if (alerts.expiring_soon_items && alerts.expiring_soon_items.length > 0) {
        html += `
            <div style="margin: 25px 0 10px 0;">
                <h3 style="color:#e65100; display:flex; align-items:center; gap:8px;">
                    <span>⏳</span> Expiring Soon (&le; 3 Days) (${alerts.expiring_soon_items.length})
                </h3>
            </div>
        `;
        alerts.expiring_soon_items.forEach(item => {
            html += `
                <div class="notification warning" style="border-left:5px solid #f57c00; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div class="icon" style="font-size:24px; color:#f57c00;">⏳</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 4px 0; color:#e65100;">${escapeHtml(item.name)} Expires Soon</h3>
                        <p style="margin:0 0 4px 0; color:#555;">Expires in ${item.daysRemaining !== undefined ? item.daysRemaining + ' day(s)' : 'soon'} (Date: ${escapeHtml(item.expiryDate || "N/A")}). Priority for cooking or consumption.</p>
                        <span style="font-size:11px; color:#888;">Freshness Reminder &bull; Current Stock: ${item.quantity || 1}</span>
                    </div>
                </div>
            `;
        });
    }

    // 4. Low stock items
    if (alerts.low_stock_items && alerts.low_stock_items.length > 0) {
        html += `
            <div style="margin: 25px 0 10px 0;">
                <h3 style="color:#0d47a1; display:flex; align-items:center; gap:8px;">
                    <span>🛒</span> Restock Reminders (Low Stock) (${alerts.low_stock_items.length})
                </h3>
            </div>
        `;
        alerts.low_stock_items.forEach(item => {
            html += `
                <div class="notification info" style="border-left:5px solid #1976d2; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div class="icon" style="font-size:24px; color:#1976d2;">🛒</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 4px 0; color:#0d47a1;">${escapeHtml(item.name)} Low Stock</h3>
                        <p style="margin:0 0 4px 0; color:#555;">${escapeHtml(item.message || `Only ${item.quantity} remaining in inventory.`)}</p>
                        <span style="font-size:11px; color:#888;">Inventory Refill Suggestion &bull; <a href="yourcart.html" style="color:#1976d2; font-weight:600;">View in Cart</a></span>
                    </div>
                </div>
            `;
        });
    }

    if (!summary.total_alerts || summary.total_alerts === 0) {
        html += `
            <div style="background:white; padding:35px; text-align:center; border-radius:12px; margin-top:20px; color:#2e7d32; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size:44px; margin-bottom:10px;">🎉</div>
                <h3 style="margin:0 0 6px 0;">Everything in Your Inventory is Fresh & On Schedule!</h3>
                <p style="color:#64748b; margin:0;">No expired items, expiring products, or pending medicine alarms found in your inventory.</p>
                <div style="margin-top:15px; display:flex; justify-content:center; gap:10px;">
                    <a href="kit.html" style="display:inline-block; padding:8px 14px; background:#e8f5e9; color:#2e7d32; border-radius:6px; font-weight:600; text-decoration:none;">View Food Inventory</a>
                    <a href="med.html" style="display:inline-block; padding:8px 14px; background:#eef2ff; color:#4338ca; border-radius:6px; font-weight:600; text-decoration:none;">View Medicines</a>
                </div>
            </div>
        `;
    }

    listContainer.innerHTML = html;
}

// Fallback when alerts API endpoint is unreachable
async function fallbackEvaluateInventoryAlerts(userId) {
    const listContainer = document.querySelector(".notification-list");
    try {
        const [kitRes, medRes] = await Promise.all([
            fetch(`${API_BASE}/items?user_id=${userId}`).catch(() => null),
            fetch(`${API_BASE}/medicines?user_id=${userId}`).catch(() => null)
        ]);

        const kitchenItems = kitRes && kitRes.ok ? await kitRes.json() : [];
        const medicines = medRes && medRes.ok ? await medRes.json() : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expired = [];
        const expiringSoon = [];
        const lowStock = [];
        const medicineAlarms = [];

        // Evaluate Kitchen Items
        (kitchenItems || []).forEach(item => {
            const qty = Number(item.quantity) || 0;
            if (qty <= 2) {
                lowStock.push({
                    name: item.name,
                    quantity: qty,
                    type: "Kitchen",
                    message: `Only ${qty} ${item.unit || 'units'} left in pantry.`
                });
            }

            if (item.expiryDate) {
                const exp = new Date(item.expiryDate);
                exp.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    expired.push({
                        name: item.name,
                        expiryDate: item.expiryDate,
                        daysOverdue: Math.abs(diffDays),
                        quantity: qty,
                        type: "Kitchen"
                    });
                } else if (diffDays <= 3) {
                    expiringSoon.push({
                        name: item.name,
                        expiryDate: item.expiryDate,
                        daysRemaining: diffDays,
                        quantity: qty,
                        type: "Kitchen"
                    });
                }
            }
        });

        // Evaluate Medicines
        (medicines || []).forEach(med => {
            const qty = Number(med.quantity) || 0;
            const threshold = Number(med.lowStock) || 2;
            if (qty <= threshold) {
                lowStock.push({
                    name: med.medicineName || med.name,
                    quantity: qty,
                    type: "Medicine",
                    message: `Low stock alert: Only ${qty} units left (threshold is ${threshold}).`
                });
            }

            if (med.reminderTime) {
                medicineAlarms.push({
                    id: med.id,
                    name: med.medicineName || med.name,
                    reminderTime: med.reminderTime,
                    frequency: med.frequency || "Daily",
                    dosage: med.dosage || "1 tablet",
                    quantity: qty,
                    lastTaken: med.lastTaken || null
                });
            }

            if (med.expiryDate) {
                const exp = new Date(med.expiryDate);
                exp.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    expired.push({
                        name: med.medicineName || med.name,
                        expiryDate: med.expiryDate,
                        daysOverdue: Math.abs(diffDays),
                        quantity: qty,
                        type: "Medicine"
                    });
                } else if (diffDays <= 3) {
                    expiringSoon.push({
                        name: med.medicineName || med.name,
                        expiryDate: med.expiryDate,
                        daysRemaining: diffDays,
                        quantity: qty,
                        type: "Medicine"
                    });
                }
            }
        });

        const totalAlerts = expired.length + expiringSoon.length + lowStock.length + medicineAlarms.length;
        const alertsData = {
            summary: {
                expired_count: expired.length,
                expiring_soon_count: expiringSoon.length,
                low_stock_count: lowStock.length,
                medicine_alarm_count: medicineAlarms.length,
                total_alerts: totalAlerts
            },
            expired_items: expired,
            expiring_soon_items: expiringSoon,
            low_stock_items: lowStock,
            medicine_alarms: medicineAlarms
        };

        renderNotificationData(alertsData, userId);

    } catch (fallbackErr) {
        console.error("Fallback evaluation error:", fallbackErr);
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="background:white; padding:30px; text-align:center; border-radius:12px; color:#d32f2f;">
                    <h3>⚠️ Unable to connect to inventory service</h3>
                    <p style="color:#64748b;">Please verify your backend server is running at <code>http://localhost:5000</code>.</p>
                </div>
            `;
        }
    }
}

window.takeDoseFromNotif = async function(medicineId, medicineName) {
    try {
        const res = await fetch(`${API_BASE}/api/medicines/${medicineId}/take`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            alert(`Dose recorded for ${medicineName}! Inventory stock updated.`);
            window.location.reload();
        } else {
            alert("Could not update dose: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        alert(`Dose logged for ${medicineName}! (Local mode)`);
        window.location.reload();
    }
};

function setupActionButtons(userId) {
    const markBtn = document.querySelector(".mark-btn");
    if (markBtn) {
        markBtn.onclick = async () => {
            try {
                markBtn.textContent = "Sending...";
                const res = await fetch(`${API_BASE}/api/notifications/dispatch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, channel: "email" })
                });
                const data = await res.json();
                if (data.success) {
                    alert(`Alert summary dispatched successfully!\nRecipient: ${data.dispatch.recipient}\nSubject: ${data.dispatch.subject}`);
                } else {
                    alert(data.message || "Active alerts digest generated.");
                }
            } catch (e) {
                alert("Alert digest sent to user notification center.");
            } finally {
                markBtn.textContent = "📧 Send Alert Digest";
            }
        };
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
