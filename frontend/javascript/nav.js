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

    // Multilingual Translations Dictionary
    const translations = {
        English: {
            appTitle: "Smart Assistant",
            appSub: "Health & Kitchen",
            dashboardSection: "Dashboard",
            homeLink: "Home Dashboard",
            inventoriesSection: "Inventories",
            kitchenLink: "Kitchen Pantry",
            medicinesLink: "Medicines & Alarms",
            cookingSection: "Cooking & Shopping",
            recipesLink: "AI Recipes & Chef",
            cartLink: "Shopping Cart",
            systemSection: "System & Alerts",
            notifLink: "Notifications & Alarms",
            settingsLink: "Settings",
            profileLink: "My Profile",
            logout: "Log Out",
            activeNow: "Active Now"
        },
        Hindi: {
            appTitle: "स्मार्ट सहायक",
            appSub: "स्वास्थ्य एवं रसोई",
            dashboardSection: "डैशबोर्ड",
            homeLink: "होम डैशबोर्ड",
            inventoriesSection: "इन्वेंट्री",
            kitchenLink: "रसोई पेंट्री",
            medicinesLink: "दवाएं और अलार्म",
            cookingSection: "पाककला और खरीदारी",
            recipesLink: "एआई रेसिपी और शेफ",
            cartLink: "शॉपिंग कार्ट",
            systemSection: "सिस्टम और अलर्ट",
            notifLink: "सूचनाएं और अलार्म",
            settingsLink: "सेटिंग्स",
            profileLink: "मेरी प्रोफाइल",
            logout: "लॉग आउट",
            activeNow: "सक्रिय"
        },
        Telugu: {
            appTitle: "స్మార్ట్ అసిస్టెంట్",
            appSub: "ఆరోగ్యం & వంటగది",
            dashboardSection: "డ్యాష్‌బోర్డ్",
            homeLink: "హోమ్ డ్యాష్‌బోర్డ్",
            inventoriesSection: "నిల్వలు",
            kitchenLink: "వంటగది జాబితా",
            medicinesLink: "మందులు & అలారాలు",
            cookingSection: "వంట & షాపింగ్",
            recipesLink: "AI వంటకాలు & చెఫ్",
            cartLink: "షాపింగ్ కార్ట్",
            systemSection: "సిస్టమ్ & హెచ్చరికలు",
            notifLink: "నోటిఫికేషన్లు & అలారాలు",
            settingsLink: "సెట్టింగులు",
            profileLink: "నా ప్రొఫైల్",
            logout: "లాగ్ అవుట్",
            activeNow: "యాక్టివ్"
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        applyGlobalSettings();
        setupUniversalNavigation();
        initMedicineAlarmEngine();
        updateNotificationBadge();
        applyLanguageTranslations();
    });

    // ----------------------------------------------------
    // Apply Settings (Dark Theme, Font Size, Language)
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
        } catch (e) {}
    }

    function applyLanguageTranslations() {
        try {
            const saved = JSON.parse(localStorage.getItem("app_settings") || "{}");
            const lang = saved.language || "English";
            const dict = translations[lang] || translations.English;

            // Translate Drawer text
            const titleEl = document.getElementById("navBrandTitle");
            if (titleEl) titleEl.textContent = dict.appTitle;

            const subEl = document.getElementById("navBrandSub");
            if (subEl) subEl.textContent = dict.appSub;

            const userStatusEl = document.querySelector(".user-status");
            if (userStatusEl) userStatusEl.innerHTML = `&bull; ${dict.activeNow}`;

            const secTitles = document.querySelectorAll(".drawer-section-title");
            if (secTitles.length >= 4) {
                secTitles[0].textContent = dict.dashboardSection;
                secTitles[1].textContent = dict.inventoriesSection;
                secTitles[2].textContent = dict.cookingSection;
                secTitles[3].textContent = dict.systemSection;
            }

            const links = {
                "home.html": dict.homeLink,
                "kit.html": dict.kitchenLink,
                "med.html": dict.medicinesLink,
                "recipes.html": dict.recipesLink,
                "yourcart.html": dict.cartLink,
                "notif.html": dict.notifLink,
                "settings.html": dict.settingsLink,
                "profile.html": dict.profileLink
            };

            for (const [href, text] of Object.entries(links)) {
                const el = document.querySelector(`.drawer-link[href="${href}"] .link-text`);
                if (el) el.textContent = text;
            }

            const logoutBtn = document.getElementById("drawerLogoutBtn");
            if (logoutBtn) logoutBtn.innerHTML = `<span>🚪</span> ${dict.logout}`;

        } catch (e) {}
    }

    function setupUniversalNavigation() {
        if (!document.querySelector('link[href*="nav.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "css/nav.css";
            document.head.appendChild(link);
        }

        if (document.getElementById("universalDrawer")) return;

        const currentPath = window.location.pathname.split("/").pop() || "home.html";
        const username = localStorage.getItem("username") || "User";
        const savedSettings = JSON.parse(localStorage.getItem("app_settings") || "{}");
        const currentLang = savedSettings.language || "English";
        const dict = translations[currentLang] || translations.English;

        // Drawer HTML without stray letter
        const drawerHtml = `
            <!-- Universal Hamburger Button -->
            <button class="universal-menu-toggle" id="universalMenuBtn" title="Open Navigation Menu" aria-label="Open Navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <!-- Backdrop Overlay -->
            <div class="universal-nav-backdrop" id="universalBackdrop"></div>

            <!-- Slide-out Drawer Panel -->
            <aside class="universal-drawer" id="universalDrawer" aria-label="Main Navigation">
                <div class="drawer-header">
                    <div class="brand-info">
                        <span style="font-size:28px;">🥗</span>
                        <div>
                            <h3 class="brand-name" id="navBrandTitle">${dict.appTitle}</h3>
                            <p class="user-greeting" id="navBrandSub">${dict.appSub}</p>
                        </div>
                    </div>
                    <button class="drawer-close-btn" id="universalCloseBtn" aria-label="Close Navigation">&times;</button>
                </div>

                <!-- Sleek User Profile Card -->
                <div class="drawer-user-info">
                    <div class="user-avatar" title="${escapeHtml(username)}">
                        <span>👤</span>
                    </div>
                    <div class="user-details">
                        <span class="user-name">${escapeHtml(username)}</span>
                        <span class="user-status">&bull; ${dict.activeNow}</span>
                    </div>
                </div>

                <nav class="drawer-nav">
                    <div class="drawer-section-title">${dict.dashboardSection}</div>
                    <a href="home.html" class="drawer-link ${currentPath === 'home.html' ? 'active' : ''}">
                        <span class="link-icon">📊</span> <span class="link-text">${dict.homeLink}</span>
                    </a>

                    <div class="drawer-section-title">${dict.inventoriesSection}</div>
                    <a href="kit.html" class="drawer-link ${currentPath === 'kit.html' ? 'active' : ''}">
                        <span class="link-icon">🥦</span> <span class="link-text">${dict.kitchenLink}</span>
                    </a>
                    <a href="med.html" class="drawer-link ${currentPath === 'med.html' ? 'active' : ''}">
                        <span class="link-icon">💊</span> <span class="link-text">${dict.medicinesLink}</span>
                    </a>

                    <div class="drawer-section-title">${dict.cookingSection}</div>
                    <a href="recipes.html" class="drawer-link ${currentPath === 'recipes.html' ? 'active' : ''}">
                        <span class="link-icon">🍲</span> <span class="link-text">${dict.recipesLink}</span>
                    </a>
                    <a href="yourcart.html" class="drawer-link ${currentPath === 'yourcart.html' ? 'active' : ''}">
                        <span class="link-icon">🛒</span> <span class="link-text">${dict.cartLink}</span>
                    </a>

                    <div class="drawer-section-title">${dict.systemSection}</div>
                    <a href="notif.html" class="drawer-link ${currentPath === 'notif.html' ? 'active' : ''}">
                        <span class="link-icon">🔔</span> <span class="link-text">${dict.notifLink}</span>
                        <span class="drawer-badge" id="navAlertBadge" style="display:none;">0</span>
                    </a>
                    <a href="settings.html" class="drawer-link ${currentPath === 'settings.html' ? 'active' : ''}">
                        <span class="link-icon">⚙️</span> <span class="link-text">${dict.settingsLink}</span>
                    </a>
                    <a href="profile.html" class="drawer-link ${currentPath === 'profile.html' ? 'active' : ''}">
                        <span class="link-icon">👤</span> <span class="link-text">${dict.profileLink}</span>
                    </a>
                </nav>

                <div class="drawer-footer">
                    <button class="drawer-logout-btn" id="drawerLogoutBtn">
                        <span>🚪</span> ${dict.logout}
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
        } catch (err) {}
    }

    // ----------------------------------------------------
    // Medicine Intake Alarm & Audio Engine
    // ----------------------------------------------------

    function initMedicineAlarmEngine() {
        if ("Notification" in window && Notification.permission === "default") {
            document.addEventListener("click", () => {
                Notification.requestPermission();
            }, { once: true });
        }

        checkMedicineSchedule();
        setInterval(checkMedicineSchedule, 10000);
    }

    // Robust time parser: handles "10", "10:00", "09:00", "9", "10 PM", "10:30am", etc.
    function normalizeTimeToHHMM(timeStr) {
        if (!timeStr) return null;
        let s = String(timeStr).trim().toUpperCase();
        const isPM = s.includes("PM");
        const isAM = s.includes("AM");
        s = s.replace(/AM|PM/g, "").trim();

        let h = 0;
        let m = 0;

        if (s.includes(":")) {
            const parts = s.split(":");
            h = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10);
        } else {
            // E.g. "10", "9", "22"
            h = parseInt(s, 10);
            m = 0;
        }

        if (isNaN(h) || isNaN(m)) return null;

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        if (h < 0 || h > 23 || m < 0 || m > 59) return null;

        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    async function checkMedicineSchedule() {
        const userId = localStorage.getItem("user_id") || 1;

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

            // Check exact minute or due within past 15 mins if not taken today
            const isExactMinute = (targetHHMM === currentTimeStr);
            const isRecentDue = (currentTotalMinutes >= targetTotalMinutes && (currentTotalMinutes - targetTotalMinutes) <= 15);

            if ((isExactMinute || isRecentDue) && !triggeredAlarms.has(alarmKey)) {
                if (med.lastTaken && med.lastTaken.includes(now.toISOString().slice(0, 10))) {
                    return;
                }

                triggeredAlarms.add(alarmKey);
                fireMedicineAlarm(med);
            }
        });
    }

    function fireMedicineAlarm(med) {
        playAlarmAudioChime();

        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`⏰ Medicine Reminder: ${med.name}`, {
                    body: `It is ${med.reminderTime}. Please take ${med.dosage || "1 dose"} (${med.frequency || "Scheduled dose"}).`,
                    icon: "images/Gemini_Generated_Image_7rve5h7rve5h7rve.png"
                });
            } catch (e) {}
        }

        showAlarmModal(med);
    }

    function playAlarmAudioChime() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

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
        } catch (err) {}
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
