const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id") || 1;
    loadNotifications(userId);
    setupActionButtons(userId);
});

async function loadNotifications(userId) {
    try {
        const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`);
        const data = await res.json();
        const alerts = data.alerts || {};
        const summary = alerts.summary || {};

        // Update Summary Cards
        const urgentCountEl = document.querySelector(".card.urgent h2");
        if (urgentCountEl) urgentCountEl.textContent = summary.expired_count || 0;

        const warningCountEl = document.querySelector(".card.warning h2");
        if (warningCountEl) warningCountEl.textContent = summary.expiring_soon_count || 0;

        const refillCountEl = document.querySelector(".card.info h2");
        if (refillCountEl) refillCountEl.textContent = summary.low_stock_count || 0;

        // Inject 4th summary card for medicine alarms if not present
        const summarySec = document.querySelector(".summary");
        if (summarySec && !document.getElementById("medAlarmCard")) {
            const medCard = document.createElement("div");
            medCard.id = "medAlarmCard";
            medCard.className = "card";
            medCard.style.background = "#eef2ff";
            medCard.style.borderLeft = "4px solid #6366f1";
            medCard.innerHTML = `
                <i class="fa-solid fa-bell" style="color:#6366f1; font-size:24px;"></i>
                <h2 style="color:#4338ca;">${summary.medicine_alarm_count || 0}</h2>
                <p style="color:#475569;">Medicine Alarms</p>
            `;
            summarySec.appendChild(medCard);
        } else if (document.getElementById("medAlarmCard")) {
            document.querySelector("#medAlarmCard h2").textContent = summary.medicine_alarm_count || 0;
        }

        // Render Notification List
        const listContainer = document.querySelector(".notification-list");
        if (!listContainer) return;

        let html = `<h2>Active Alerts & Reminders (${summary.total_alerts || 0})</h2>`;

        // Section 1: Medicine Reminders & Alarms
        if (alerts.medicine_alarms && alerts.medicine_alarms.length > 0) {
            html += `
                <div style="margin: 20px 0 10px 0;">
                    <h3 style="color:#4338ca; display:flex; align-items:center; gap:8px;">
                        <span>⏰</span> Scheduled Medicine Intake Alarms
                    </h3>
                </div>
            `;

            alerts.medicine_alarms.forEach(med => {
                html += `
                    <div class="notification" style="border-left:5px solid #6366f1; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                        <div style="display:flex; gap:15px; align-items:center;">
                            <div class="icon" style="font-size:26px;">⏰</div>
                            <div class="content">
                                <h3 style="margin:0 0 4px 0; color:#1e1b4b;">${escapeHtml(med.name)} &bull; ${escapeHtml(med.reminderTime)}</h3>
                                <p style="margin:0 0 4px 0; color:#475569;">Dosage: <strong>${escapeHtml(med.dosage)}</strong> &bull; Frequency: ${escapeHtml(med.frequency)} &bull; Stock: ${med.quantity} left</p>
                                <span style="font-size:11px; color:#64748b;">
                                    ${med.lastTaken ? `Last taken: ${escapeHtml(med.lastTaken)}` : "Pending today's scheduled dose"}
                                </span>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button onclick="takeDoseFromNotif(${med.id}, '${escapeHtml(med.name)}')" style="background:#2e7d32; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer;">
                                ✓ Take Dose
                            </button>
                            <button onclick="window.triggerTestMedicineAlarm('${escapeHtml(med.name)}', '${escapeHtml(med.dosage)}')" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#334155; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer;" title="Preview chime sound & popup">
                                🔊 Test Alarm
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        // Section 2: Expired items
        if (alerts.expired_items && alerts.expired_items.length > 0) {
            html += `
                <div style="margin: 25px 0 10px 0;">
                    <h3 style="color:#d32f2f; display:flex; align-items:center; gap:8px;">
                        <span>⚠️</span> Expired Items (Action Required)
                    </h3>
                </div>
            `;
            alerts.expired_items.forEach(item => {
                html += `
                    <div class="notification urgent" style="border-left:5px solid #d32f2f; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                        <div class="icon" style="font-size:24px; color:#d32f2f;">⚠️</div>
                        <div class="content" style="flex:1;">
                            <h3 style="margin:0 0 4px 0; color:#d32f2f;">${escapeHtml(item.name)} Expired!</h3>
                            <p style="margin:0 0 4px 0; color:#555;">Expired ${item.daysOverdue} days ago (Expiry: ${escapeHtml(item.expiryDate || "N/A")}). Please safely discard or replace.</p>
                            <span style="font-size:11px; color:#888;">Critical Health & Freshness Alert</span>
                        </div>
                    </div>
                `;
            });
        }

        // Section 3: Expiring soon items
        if (alerts.expiring_soon_items && alerts.expiring_soon_items.length > 0) {
            html += `
                <div style="margin: 25px 0 10px 0;">
                    <h3 style="color:#e65100; display:flex; align-items:center; gap:8px;">
                        <span>⏳</span> Expiring Soon (&le; 3 Days)
                    </h3>
                </div>
            `;
            alerts.expiring_soon_items.forEach(item => {
                html += `
                    <div class="notification warning" style="border-left:5px solid #f57c00; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                        <div class="icon" style="font-size:24px; color:#f57c00;">⏳</div>
                        <div class="content" style="flex:1;">
                            <h3 style="margin:0 0 4px 0; color:#e65100;">${escapeHtml(item.name)} Expires Soon</h3>
                            <p style="margin:0 0 4px 0; color:#555;">Expires in ${item.daysRemaining} day(s) (Date: ${escapeHtml(item.expiryDate || "N/A")}). Priority for consumption.</p>
                            <span style="font-size:11px; color:#888;">Expiring Soon Reminder</span>
                        </div>
                    </div>
                `;
            });
        }

        // Section 4: Low stock items
        if (alerts.low_stock_items && alerts.low_stock_items.length > 0) {
            html += `
                <div style="margin: 25px 0 10px 0;">
                    <h3 style="color:#0d47a1; display:flex; align-items:center; gap:8px;">
                        <span>🛒</span> Restock Reminders (Low Stock)
                    </h3>
                </div>
            `;
            alerts.low_stock_items.forEach(item => {
                html += `
                    <div class="notification info" style="border-left:5px solid #1976d2; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                        <div class="icon" style="font-size:24px; color:#1976d2;">🛒</div>
                        <div class="content" style="flex:1;">
                            <h3 style="margin:0 0 4px 0; color:#0d47a1;">${escapeHtml(item.name)} Low Stock</h3>
                            <p style="margin:0 0 4px 0; color:#555;">${escapeHtml(item.message)}</p>
                            <span style="font-size:11px; color:#888;">Inventory Refill Suggestion</span>
                        </div>
                    </div>
                `;
            });
        }

        if (summary.total_alerts === 0) {
            html += `
                <div style="background:white; padding:35px; text-align:center; border-radius:12px; margin-top:20px; color:#2e7d32; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <div style="font-size:44px; margin-bottom:10px;">🎉</div>
                    <h3 style="margin:0 0 6px 0;">Everything is Fresh & On Schedule!</h3>
                    <p style="color:#64748b; margin:0;">No expired items, expiring products, or pending medicine alarms detected.</p>
                </div>
            `;
        }

        listContainer.innerHTML = html;

    } catch (err) {
        console.error("Failed to load notifications:", err);
    }
}

window.takeDoseFromNotif = async function(medicineId, medicineName) {
    try {
        const res = await fetch(`${API_BASE}/api/medicines/${medicineId}/take`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            alert(`Dose recorded for ${medicineName}! Stock updated.`);
            window.location.reload();
        } else {
            alert("Could not update dose.");
        }
    } catch (err) {
        alert("Failed to reach server.");
    }
};

function setupActionButtons(userId) {
    const navbar = document.querySelector(".top-navbar");
    if (!navbar) return;

    // Check if test alarm button already exists
    if (!document.getElementById("testAlarmBtn")) {
        const testBtn = document.createElement("button");
        testBtn.id = "testAlarmBtn";
        testBtn.innerHTML = "🔊 Test Chime & Alarm";
        testBtn.style.cssText = "background:#6366f1; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer; margin-right:8px;";
        testBtn.onclick = () => {
            if (window.triggerTestMedicineAlarm) {
                window.triggerTestMedicineAlarm("Dolo 650mg", "1 tablet");
            }
        };
        navbar.appendChild(testBtn);
    }

    const markBtn = document.querySelector(".mark-btn");
    if (markBtn) {
        markBtn.textContent = "📧 Send Alert Digest";
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
                    alert(data.message || "No active alerts to send.");
                }
            } catch (e) {
                alert("Failed to dispatch alert.");
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
