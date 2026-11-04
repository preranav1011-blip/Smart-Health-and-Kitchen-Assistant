const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id") || 1;
    loadNotifications(userId);
    setupDispatchButton(userId);
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

        // Render Notification List
        const listContainer = document.querySelector(".notification-list");
        if (!listContainer) return;

        // Retain header
        let html = `<h2>Recent Notifications (${summary.total_alerts || 0})</h2>`;

        if (summary.total_alerts === 0) {
            html += `
                <div style="background:white; padding:30px; text-align:center; border-radius:12px; margin-top:15px; color:#4caf50;">
                    <h3>🎉 All Good!</h3>
                    <p>No expired, expiring soon, or low stock items detected.</p>
                </div>
            `;
            listContainer.innerHTML = html;
            return;
        }

        // Render expired items
        (alerts.expired_items || []).forEach(item => {
            html += `
                <div class="notification urgent" style="border-left:5px solid #d32f2f; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center;">
                    <div class="icon" style="font-size:24px; color:#d32f2f;">⚠️</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 5px 0; color:#d32f2f;">${escapeHtml(item.name)} Expired!</h3>
                        <p style="margin:0 0 5px 0; color:#555;">Expired ${item.daysOverdue} days ago (Expiry: ${escapeHtml(item.expiryDate || "N/A")}). Please safely discard or replace.</p>
                        <span style="font-size:11px; color:#888;">Critical Health & Freshness Alert</span>
                    </div>
                </div>
            `;
        });

        // Render expiring soon items
        (alerts.expiring_soon_items || []).forEach(item => {
            html += `
                <div class="notification warning" style="border-left:5px solid #f57c00; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center;">
                    <div class="icon" style="font-size:24px; color:#f57c00;">⏳</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 5px 0; color:#e65100;">${escapeHtml(item.name)} Expires Soon</h3>
                        <p style="margin:0 0 5px 0; color:#555;">Expires in ${item.daysRemaining} day(s) (Date: ${escapeHtml(item.expiryDate || "N/A")}). Priority for consumption.</p>
                        <span style="font-size:11px; color:#888;">Expiring Soon Reminder</span>
                    </div>
                </div>
            `;
        });

        // Render low stock items
        (alerts.low_stock_items || []).forEach(item => {
            html += `
                <div class="notification info" style="border-left:5px solid #1976d2; margin-bottom:12px; padding:15px; background:white; border-radius:8px; display:flex; gap:15px; align-items:center;">
                    <div class="icon" style="font-size:24px; color:#1976d2;">🛒</div>
                    <div class="content" style="flex:1;">
                        <h3 style="margin:0 0 5px 0; color:#0d47a1;">${escapeHtml(item.name)} Low Stock</h3>
                        <p style="margin:0 0 5px 0; color:#555;">${escapeHtml(item.message)}</p>
                        <span style="font-size:11px; color:#888;">Inventory Refill Suggestion</span>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;

    } catch (err) {
        console.error("Failed to load notifications:", err);
    }
}

function setupDispatchButton(userId) {
    const markBtn = document.querySelector(".mark-btn");
    if (!markBtn) return;

    markBtn.textContent = "Send Alert Email / Push";
    markBtn.style.cursor = "pointer";

    markBtn.addEventListener("click", async () => {
        try {
            markBtn.textContent = "Sending...";
            const res = await fetch(`${API_BASE}/api/notifications/dispatch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, channel: "email" })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Notification Dispatch Successful!\nStatus: ${data.dispatch.status}\nRecipient: ${data.dispatch.recipient || "User"}\nSubject: ${data.dispatch.subject || "Alert Digest"}`);
            } else {
                alert(`Notice: ${data.message}`);
            }
        } catch (err) {
            console.error("Dispatch error:", err);
            alert("Could not reach server to dispatch alert.");
        } finally {
            markBtn.textContent = "Send Alert Email / Push";
        }
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
