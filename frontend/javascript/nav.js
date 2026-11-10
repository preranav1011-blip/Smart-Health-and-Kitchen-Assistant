// ========================================================
// Universal Navigation & Medicine Alarm System
// Smart Health & Kitchen Assistant
// ========================================================

(function () {
    const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

    // Track triggered alarms to prevent repeating in the same minute
    const triggeredAlarms = new Set();

    document.addEventListener("DOMContentLoaded", () => {
        applyGlobalSettings();
        setupUniversalNavigation();
        initMedicineAlarmEngine();
        updateNotificationBadge();
    });

    // ----------------------------------------------------
    // Apply Settings (Dark Theme, Font Size) System-Wide
    // ----------------------------------------------------
    function applyGlobalSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem("app_settings") || "{}");
            let theme = saved.theme || "Light";

            if (theme === "System Default") {
                theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "Dark" : "Light";
            }

            if (theme === "Dark") {
                document.body.classList.add("dark-theme");
                document.body.style.backgroundColor = "#0f172a";
                document.body.style.color = "#f8fafc";
            }

            if (saved.fontSize === "Small") {
                document.documentElement.style.fontSize = "14px";
            } else if (saved.fontSize === "Large") {
                document.documentElement.style.fontSize = "18px";
            }
        } catch (e) {
            // Ignore settings parse error
        }
    }

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

            <!-- Backdrop Overlay -->
            <div class="universal-drawer-backdrop" id="universalBackdrop"></div>

            <!-- Slide-out Drawer Panel -->
            <aside class="universal-drawer" id="universalDrawer" aria-label="Main Navigation">
                <div class="drawer-header">
                    <div class="drawer-brand">
                        <span class="brand-icon">🥗</span>
                        <div class="brand-text">
                            <h3>Smart Assistant</h3>
                            <p>Health & Kitchen</p>
                        </div>
                    </div>
                    <button class="drawer-close-btn" id="universalCloseBtn" aria-label="Close Navigation">&times;</button>
                </div>

                <div class="drawer-user-info">
                    <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <span class="user-name">${escapeHtml(username)}</span>
                        <span class="user-status">&bull; Active Now</span>
                    </div>
                </div>

                <nav class="drawer-links">
                    <div class="drawer-section-title">Dashboard</div>
                    <a href="home.html" class="drawer-link ${currentPath === 'home.html' ? 'active' : ''}">
                        <span class="link-icon">📊</span> Home Dashboard
                    </a>

                    <div class="drawer-section-title">Inventories</div>
                    <a href="kit.html" class="drawer-link ${currentPath === 'kit.html' ? 'active' : ''}">
                        <span class="link-icon">🥦</span> Kitchen Pantry
                    </a>
                    <a href="med.html" class="drawer-link ${currentPath === 'med.html' ? 'active' : ''}">
                        <span class="link-icon">💊</span> Medicines & Alarms
                    </a>

                    <div class="drawer-section-title">Cooking & Shopping</div>
                    <a href="recipes.html" class="drawer-link ${currentPath === 'recipes.html' ? 'active' : ''}">
                        <span class="link-icon">🍲</span> AI Recipes & Chef
                    </a>
                    <a href="yourcart.html" class="drawer-link ${currentPath === 'yourcart.html' ? 'active' : ''}">
                        <span class="link-icon">🛒</span> Shopping Cart
                    </a>

                    <div class="drawer-section-title">System & Alerts</div>
                    <a href="notif.html" class="drawer-link ${currentPath === 'notif.html' ? 'active' : ''}">
                        <span class="link-icon">🔔</span> Notifications & Alarms
                        <span class="alert-badge" id="navAlertBadge" style="display:none;">0</span>
                    </a>
                    <a href="settings.html" class="drawer-link ${currentPath === 'settings.html' ? 'active' : ''}">
                        <span class="link-icon">⚙️</span> Settings
                    </a>
                    <a href="profile.html" class="drawer-link ${currentPath === 'profile.html' ? 'active' : ''}">
                        <span class="link-icon">👤</span> My Profile
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

        const drawer = document.getElementById("universalDrawer");
        const backdrop = document.getElementById("universalBackdrop");
        const menuBtn = document.getElementById("universalMenuBtn");
        const closeBtn = document.getElementById("universalCloseBtn");
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
            const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`, { cache: "no-store" });
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

        // Check medicine schedule immediately and every 10 seconds against real system clock
        checkMedicineSchedule();
        setInterval(checkMedicineSchedule, 10000);
    }

    function normalizeTimeToHHMM(timeStr) {
        if (!timeStr) return null;
        let s = String(timeStr).trim().toUpperCase();
        const isPM = s.includes("PM");
        const isAM = s.includes("AM");
        s = s.replace(/AM|PM/g, "").trim();

        const parts = s.split(":");
        if (parts.length < 2) return null;

        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    async function checkMedicineSchedule() {
        const userId = localStorage.getItem("user_id") || 1;

        // Current real system local time
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, "0");
        const currentMinutes = String(now.getMinutes()).padStart(2, "0");
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        let alarms = [];

        try {
            const res = await fetch(`${API_BASE}/api/notifications/alerts?user_id=${userId}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                alarms = (data.alerts && data.alerts.medicine_alarms) || [];
            }
        } catch (err) {
            // Fallback: fetch medicines directly
            try {
                const res2 = await fetch(`${API_BASE}/medicines?user_id=${userId}`);
                if (res2.ok) {
                    const meds = await res2.json();
                    alarms = meds.filter(m => m.reminderTime).map(m => ({
                        id: m.id,
                        name: m.medicineName || m.name,
                        reminderTime: m.reminderTime,
                        frequency: m.frequency || "Daily",
                        dosage: m.dosage || "1 tablet",
                        isAlarmActive: m.isAlarmActive !== undefined ? m.isAlarmActive : true,
                        lastTaken: m.lastTaken
                    }));
                }
            } catch (e2) {}
        }

        alarms.forEach(med => {
            const isActive = (med.isAlarmActive !== false && med.isAlarmActive !== 0);
            if (!isActive || !med.reminderTime) return;

            const targetHHMM = normalizeTimeToHHMM(med.reminderTime);
            if (!targetHHMM) return;

            const [tH, tM] = targetHHMM.split(":").map(Number);
            const targetTotalMinutes = tH * 60 + tM;

            const alarmKey = `${med.id}_${now.toDateString()}_${targetHHMM}`;

            // 1. Exact minute match
            const isExactMinute = (targetHHMM === currentTimeStr);

            // 2. Or was due in the last 15 minutes and not yet acknowledged today
            const isRecentDue = (currentTotalMinutes >= targetTotalMinutes && currentTotalMinutes - targetTotalMinutes <= 15);

            if ((isExactMinute || isRecentDue) && !triggeredAlarms.has(alarmKey)) {
                // If already taken today, don't trigger
                if (med.lastTaken && med.lastTaken.includes(now.toISOString().slice(0, 10))) {
                    return;
                }

                triggeredAlarms.add(alarmKey);
                fireMedicineAlarm(med);
            }
        });
    }

    function fireMedicineAlarm(med) {
        // 1. Play soothing alarm chime via Web Audio API
        playAlarmAudioChime();

        // 2. Desktop notification
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`⏰ Medicine Reminder: ${med.name}`, {
                    body: `It is ${med.reminderTime}. Please take ${med.dosage || "1 dose"} (${med.frequency || "Scheduled dose"}).`,
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
                        It's time to take your scheduled dose of <strong style="color:#2e7d32;">${escapeHtml(med.name)}</strong>.
                    </p>
                    <div style="background:#f1f5f9; padding:12px; border-radius:10px; margin-bottom:20px; text-align:left; font-size:14px; color:#334155;">
                        <div><strong>Dosage:</strong> ${escapeHtml(med.dosage || "1 dose")}</div>
                        <div><strong>Schedule:</strong> ${escapeHtml(med.frequency || "Daily")} at ${escapeHtml(med.reminderTime || "Scheduled Time")}</div>
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
            } catch (e) {
                alert(`Dose logged for ${med.name}!`);
            }
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
    window.triggerTestMedicineAlarm = function (name = "Prescription Dose", dosage = "1 tablet") {
        fireMedicineAlarm({
            id: 999,
            name: name,
            dosage: dosage,
            reminderTime: "Actual Time",
            frequency: "Daily Scheduled Dose",
            isAlarmActive: true
        });
    };

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
})();
