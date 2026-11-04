// ========================================================
// Universal Navigation & Medicine Alarm System
// Smart Health & Kitchen Assistant
// ========================================================

(function () {
    const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000"
        : "https://smart-health-and-kitchen-assistant.onrender.com";

    // Track triggered alarms to prevent repeating in the same minute
    const triggeredAlarms = new Set();

    document.addEventListener("DOMContentLoaded", () => {
        setupUniversalNavigation();
        initMedicineAlarmEngine();
        updateNotificationBadge();
    });

    function setupUniversalNavigation() {
        // Ensure nav.css is linked
        if (!document.querySelector('link[href*="nav.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "css/nav.css";
            document.head.appendChild(link);
        }

        // Avoid duplicate drawer injection
        if (document.getElementById("universalDrawer")) return;

        const currentPath = window.location.pathname.split("/").pop() || "home.html";
        const username = localStorage.getItem("username") || "User";

        // Create Drawer HTML
        const drawerHtml = `
            <!-- Universal Hamburger Button -->
            <button class="universal-menu-toggle" id="universalMenuBtn" title="Open Navigation Menu" aria-label="Open Navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <!-- Overlay Backdrop -->
            <div class="universal-nav-backdrop" id="universalNavBackdrop"></div>

            <!-- Slide-out Drawer -->
            <aside class="universal-drawer" id="universalDrawer">
                <div class="drawer-header">
                    <div class="brand-info">
                        <img src="images/Gemini_Generated_Image_7rve5h7rve5h7rve.png" alt="Logo" class="brand-logo" onerror="this.style.display='none'">
                        <div>
                            <h2 class="brand-name">Smart Assistant</h2>
                            <p class="user-greeting">👋 Hi, ${escapeHtml(username)}</p>
                        </div>
                    </div>
                    <button class="drawer-close-btn" id="drawerCloseBtn" title="Close Menu">&times;</button>
                </div>

                <nav class="drawer-nav">
                    <div class="drawer-section-title">Dashboard</div>
                    <a href="home.html" class="drawer-link ${currentPath === 'home.html' ? 'active' : ''}">
                        <span class="link-icon">🏠</span> Home Dashboard
                    </a>

                    <div class="drawer-section-title">Inventory</div>
                    <a href="kit.html" class="drawer-link ${currentPath === 'kit.html' ? 'active' : ''}">
                        <span class="link-icon">🥦</span> Kitchen Food
                    </a>
                    <a href="additem.html" class="drawer-link ${currentPath === 'additem.html' ? 'active' : ''}">
                        <span class="link-icon">➕</span> Add Food Item
                    </a>
                    <a href="med.html" class="drawer-link ${currentPath === 'med.html' ? 'active' : ''}">
                        <span class="link-icon">💊</span> Medicine Cabinet
                    </a>
                    <a href="additemmed.html" class="drawer-link ${currentPath === 'additemmed.html' ? 'active' : ''}">
                        <span class="link-icon">✚</span> Log Medicine & Alarm
                    </a>

                    <div class="drawer-section-title">Features</div>
                    <a href="recipes.html" class="drawer-link ${currentPath === 'recipes.html' ? 'active' : ''}">
                        <span class="link-icon">🍲</span> Recipes & AI Chef
                    </a>
                    <a href="yourcart.html" class="drawer-link ${currentPath === 'yourcart.html' ? 'active' : ''}">
                        <span class="link-icon">🛒</span> Shopping Cart
                    </a>
                    <a href="notif.html" class="drawer-link ${currentPath === 'notif.html' ? 'active' : ''}">
                        <span class="link-icon">🔔</span> Notifications & Alarms
                        <span class="drawer-badge" id="navAlertBadge" style="display:none;">0</span>
                    </a>

                    <div class="drawer-section-title">Account</div>
                    <a href="settings.html" class="drawer-link ${currentPath === 'settings.html' ? 'active' : ''}">
                        <span class="link-icon">⚙️</span> Settings
                    </a>
                </nav>

                <div class="drawer-footer">
                    <button class="drawer-logout-btn" id="drawerLogoutBtn">
                        <span>🚪</span> Log Out
                    </button>
                </div>
            </aside>
        `;

        document.body.insertAdjacentHTML("beforeend", drawerHtml);

        // Bind events
        const menuBtn = document.getElementById("universalMenuBtn");
        const closeBtn = document.getElementById("drawerCloseBtn");
        const backdrop = document.getElementById("universalNavBackdrop");
        const drawer = document.getElementById("universalDrawer");
        const logoutBtn = document.getElementById("drawerLogoutBtn");

        const openDrawer = () => {
            drawer.classList.add("open");
            backdrop.classList.add("open");
        };

        const closeDrawer = () => {
            drawer.classList.remove("open");
            backdrop.classList.remove("open");
        };

        if (menuBtn) menuBtn.addEventListener("click", openDrawer);
        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (backdrop) backdrop.addEventListener("click", closeDrawer);

        // If page already had an old #menuToggle (e.g. home.html), bind it as well
        const oldMenuToggle = document.getElementById("menuToggle");
        if (oldMenuToggle) {
            oldMenuToggle.style.cursor = "pointer";
            oldMenuToggle.addEventListener("click", (e) => {
                e.preventDefault();
                openDrawer();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("user_id");
                localStorage.removeItem("username");
                window.location.href = "login.html";
            });
        }
    }

    async function updateNotificationBadge() {
        const userId = localStorage.getItem("user_id") || 1;
        try {
            const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`);
            const data = await res.json();
            const total = data.alerts && data.alerts.summary ? data.alerts.summary.total_alerts : 0;
            const badge = document.getElementById("navAlertBadge");
            if (badge) {
                if (total > 0) {
                    badge.textContent = total;
                    badge.style.display = "inline-block";
                } else {
                    badge.style.display = "none";
                }
            }
        } catch (err) {
            // Silently handle offline/local mode
        }
    }

    // ----------------------------------------------------
    // Medicine Intake Alarm & Audio Engine
    // ----------------------------------------------------

    function initMedicineAlarmEngine() {
        // Request desktop notification permissions on user interaction
        if ("Notification" in window && Notification.permission === "default") {
            document.addEventListener("click", () => {
                Notification.requestPermission();
            }, { once: true });
        }

        // Check medicine schedule every 30 seconds
        checkMedicineSchedule();
        setInterval(checkMedicineSchedule, 30000);
    }

    async function checkMedicineSchedule() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const currentTimeStr = `${hours}:${minutes}`;

        try {
            const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`);
            const data = await res.json();
            const alarms = (data.alerts && data.alerts.medicine_alarms) || [];

            alarms.forEach(med => {
                if (!med.isAlarmActive || !med.reminderTime) return;

                // Match exact HH:MM format
                const targetTime = med.reminderTime.trim().slice(0, 5);
                const alarmKey = `${med.id}_${now.toDateString()}_${targetTime}`;

                if (targetTime === currentTimeStr && !triggeredAlarms.has(alarmKey)) {
                    triggeredAlarms.add(alarmKey);
                    fireMedicineAlarm(med);
                }
            });
        } catch (err) {
            // Silently continue
        }
    }

    function fireMedicineAlarm(med) {
        // 1. Play soothing alarm chime via Web Audio API
        playAlarmAudioChime();

        // 2. Desktop notification
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`⏰ Time to take ${med.name}!`, {
                    body: `Dosage: ${med.dosage || "1 dose"} (${med.frequency || "Scheduled dose"}). Stay healthy!`,
                    icon: "images/Gemini_Generated_Image_7rve5h7rve5h7rve.png"
                });
            } catch (e) {}
        }

        // 3. High-Priority On-screen Modal
        showAlarmModal(med);
    }

    function playAlarmAudioChime() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // Melodic multi-tone chime (C5, E5, G5, C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.value = freq;

                const startTime = ctx.currentTime + (index * 0.18);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.3, startTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.5);
            });
        } catch (err) {
            console.warn("Audio chime playback blocked or not supported:", err);
        }
    }

    function showAlarmModal(med) {
        const existing = document.getElementById("medicineAlarmModal");
        if (existing) existing.remove();

        const modalHtml = `
            <div id="medicineAlarmModal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
                <div style="background:white; border-radius:16px; padding:28px 24px; max-width:420px; width:90%; text-align:center; box-shadow:0 12px 36px rgba(0,0,0,0.3); animation:pulse 0.4s ease-out;">
                    <div style="font-size:48px; margin-bottom:8px;">⏰💊</div>
                    <h2 style="margin:0 0 8px 0; color:#1e293b; font-size:22px;">Medicine Intake Reminder!</h2>
                    <p style="font-size:16px; color:#475569; margin:4px 0 16px 0;">
                        It's time to take your dose of <strong style="color:#2e7d32;">${escapeHtml(med.name)}</strong>.
                    </p>
                    <div style="background:#f1f5f9; padding:12px; border-radius:10px; margin-bottom:20px; text-align:left; font-size:14px; color:#334155;">
                        <div><strong>Dosage:</strong> ${escapeHtml(med.dosage || "1 dose")}</div>
                        <div><strong>Schedule:</strong> ${escapeHtml(med.frequency || "Daily")} at ${escapeHtml(med.reminderTime || "Now")}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button id="btnTakeDose" style="background:#2e7d32; color:white; border:none; padding:12px; border-radius:8px; font-size:15px; font-weight:700; cursor:pointer;">
                            ✅ Mark as Taken
                        </button>
                        <div style="display:flex; gap:10px;">
                            <button id="btnSnoozeDose" style="flex:1; background:#f8fafc; border:1px solid #cbd5e1; padding:10px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; color:#475569;">
                                ⏰ Snooze 5 Mins
                            </button>
                            <button id="btnDismissDose" style="flex:1; background:#f8fafc; border:1px solid #cbd5e1; padding:10px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; color:#64748b;">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);

        const modal = document.getElementById("medicineAlarmModal");
        document.getElementById("btnTakeDose").onclick = async () => {
            try {
                await fetch(`${API_BASE}/api/medicines/${med.id}/take`, { method: "POST" });
                alert(`Dose logged for ${med.name}! Remaining stock updated.`);
            } catch (e) {}
            modal.remove();
        };

        document.getElementById("btnSnoozeDose").onclick = () => {
            alert(`Snoozed alarm for 5 minutes.`);
            modal.remove();
            setTimeout(() => {
                fireMedicineAlarm(med);
            }, 5 * 60 * 1000);
        };

        document.getElementById("btnDismissDose").onclick = () => {
            modal.remove();
        };
    }

    // Expose test helper globally for testing from UI or console
    window.triggerTestMedicineAlarm = function (name = "Vitamin C 500mg", dosage = "1 tablet") {
        fireMedicineAlarm({
            id: 999,
            name: name,
            dosage: dosage,
            reminderTime: "Now",
            frequency: "Test Schedule",
            isAlarmActive: true
        });
    };

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
})();
