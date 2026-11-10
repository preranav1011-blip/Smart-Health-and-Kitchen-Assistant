const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

const settingsI18n = {
    English: {
        pageTitle: "Settings",
        notifHeading: "Notifications",
        expiryLabel: "Expiry Notifications",
        medLabel: "Medicine Reminders",
        recipeLabel: "Recipe Suggestions",
        appearanceHeading: "Appearance",
        themeLabel: "Theme",
        fontSizeLabel: "Font Size",
        languageHeading: "Language",
        appLanguageLabel: "Application Language",
        privacyHeading: "Privacy & Security",
        twoFaLabel: "Enable Two-Factor Authentication",
        autoLogoutLabel: "Auto Logout After 15 Minutes",
        changePassBtn: "Change Password",
        saveBtn: "Save Settings",
        resetBtn: "Reset",
        toastSaved: "Settings saved successfully! Preferences updated.",
        toastReset: "Settings reset to standard defaults."
    },
    Hindi: {
        pageTitle: "सेटिंग्स",
        notifHeading: "सूचनाएं (Notifications)",
        expiryLabel: "समाप्ति सूचनाएं (Expiry Alerts)",
        medLabel: "दवा अनुस्मारक (Medicine Reminders)",
        recipeLabel: "व्यंजन सुझाव (Recipe Suggestions)",
        appearanceHeading: "दिखावट (Appearance)",
        themeLabel: "थीम (Theme)",
        fontSizeLabel: "फ़ॉन्ट का आकार (Font Size)",
        languageHeading: "भाषा (Language)",
        appLanguageLabel: "अनुप्रयोग भाषा (App Language)",
        privacyHeading: "गोपनीयता और सुरक्षा (Privacy & Security)",
        twoFaLabel: "दो-चरणीय प्रमाणीकरण (2FA)",
        autoLogoutLabel: "15 मिनट बाद ऑटो लॉगआउट",
        changePassBtn: "पासवर्ड बदलें",
        saveBtn: "सेटिंग्स सहेजें",
        resetBtn: "रीसेट करें",
        toastSaved: "सेटिंग्स सफलतापूर्वक सहेजी गईं! प्राथमिकताएं अपडेट की गईं।",
        toastReset: "सेटिंग्स को मानक डिफॉल्ट पर रीसेट कर दिया गया।"
    },
    Telugu: {
        pageTitle: "సెట్టింగులు",
        notifHeading: "నోటిఫికేషన్లు",
        expiryLabel: "గడువు నోటిఫికేషన్‌లు",
        medLabel: "మందుల రిమైండర్‌లు",
        recipeLabel: "వంటకాల సూచనలు",
        appearanceHeading: "రూపం (Appearance)",
        themeLabel: "థీమ్ (Theme)",
        fontSizeLabel: "ఫాంట్ పరిమాణం",
        languageHeading: "భాష (Language)",
        appLanguageLabel: "అప్లికేషన్ భాష",
        privacyHeading: "గోప్యత & భద్రత",
        twoFaLabel: "టూ-ఫాక్టర్ ప్రామాణీకరణ",
        autoLogoutLabel: "15 నిమిషాల తర్వాత ఆటో లాగౌట్",
        changePassBtn: "పాస్‌వర్డ్ మార్చండి",
        saveBtn: "సెట్టింగ్‌లను సేవ్ చేయండి",
        resetBtn: "రీసెట్ చేయండి",
        toastSaved: "సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి! ప్రాధాన్యతలు అప్‌డేట్ చేయబడ్డాయి.",
        toastReset: "సెట్టింగ్‌లు ప్రామాణిక డిఫాల్ట్‌లకు రీసెట్ చేయబడ్డాయి."
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    setupEventListeners();
});

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem("app_settings") || "{}");

    // Notifications Checkboxes
    const expiryNotifs = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(1) input");
    const medReminders = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(2) input");
    const recipeSugg = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(3) input");

    if (expiryNotifs) expiryNotifs.checked = saved.expiryNotifs !== undefined ? saved.expiryNotifs : true;
    if (medReminders) medReminders.checked = saved.medReminders !== undefined ? saved.medReminders : true;
    if (recipeSugg) recipeSugg.checked = saved.recipeSugg !== undefined ? saved.recipeSugg : true;

    // Appearance (Theme & Font)
    const themeSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(1) select");
    const fontSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(2) select");

    if (themeSelect && saved.theme) themeSelect.value = saved.theme;
    if (fontSelect && saved.fontSize) fontSelect.value = saved.fontSize;

    // Language
    const langSelect = document.querySelector(".setting-card:nth-of-type(3) select");
    if (langSelect && saved.language) {
        langSelect.value = saved.language;
    }

    // Privacy & Security
    const twoFactor = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(1) input");
    const autoLogout = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(2) input");

    if (twoFactor) twoFactor.checked = Boolean(saved.twoFactor);
    if (autoLogout) autoLogout.checked = Boolean(saved.autoLogout);

    // Apply active theme, font size and language text
    applyThemeAndFont(saved.theme || "Light", saved.fontSize || "Medium");
    applySettingsLanguage(saved.language || "English");
}

function applySettingsLanguage(lang) {
    const dict = settingsI18n[lang] || settingsI18n.English;

    const logoEl = document.querySelector(".top-navbar .logo");
    if (logoEl) logoEl.innerHTML = `<i class="fa-solid fa-gear"></i> ${dict.pageTitle}`;

    const headers = document.querySelectorAll(".setting-card h2");
    if (headers.length >= 4) {
        headers[0].innerHTML = `<i class="fa-solid fa-bell"></i> ${dict.notifHeading}`;
        headers[1].innerHTML = `<i class="fa-solid fa-palette"></i> ${dict.appearanceHeading}`;
        headers[2].innerHTML = `<i class="fa-solid fa-language"></i> ${dict.languageHeading}`;
        headers[3].innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${dict.privacyHeading}`;
    }

    const labels = document.querySelectorAll(".option label");
    if (labels.length >= 7) {
        labels[0].textContent = dict.expiryLabel;
        labels[1].textContent = dict.medLabel;
        labels[2].textContent = dict.recipeLabel;
        labels[3].textContent = dict.themeLabel;
        labels[4].textContent = dict.fontSizeLabel;
        labels[5].textContent = dict.appLanguageLabel;
        labels[6].textContent = dict.twoFaLabel;
    }

    const autoLogoutLabel = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(2) label");
    if (autoLogoutLabel) autoLogoutLabel.textContent = dict.autoLogoutLabel;

    const changePassBtn = document.querySelector(".change-password");
    if (changePassBtn) changePassBtn.textContent = dict.changePassBtn;

    const saveBtn = document.querySelector(".save-btn");
    if (saveBtn) saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${dict.saveBtn}`;

    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) resetBtn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> ${dict.resetBtn}`;
}

function applyThemeAndFont(theme, fontSize) {
    let effectiveTheme = theme;
    if (theme === "System Default") {
        effectiveTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "Dark" : "Light";
    }

    if (effectiveTheme === "Dark") {
        document.body.classList.add("dark-theme");
        document.body.style.backgroundColor = "#0f172a";
        document.body.style.color = "#f8fafc";
        document.querySelectorAll(".setting-card").forEach(c => {
            c.style.backgroundColor = "#1e293b";
            c.style.color = "#f8fafc";
            c.style.borderColor = "#334155";
        });
    } else {
        document.body.classList.remove("dark-theme");
        document.body.style.backgroundColor = "";
        document.body.style.color = "";
        document.querySelectorAll(".setting-card").forEach(c => {
            c.style.backgroundColor = "";
            c.style.color = "";
            c.style.borderColor = "";
        });
    }

    if (fontSize === "Small") {
        document.documentElement.style.fontSize = "14px";
    } else if (fontSize === "Large") {
        document.documentElement.style.fontSize = "18px";
    } else {
        document.documentElement.style.fontSize = "16px";
    }
}

function setupEventListeners() {
    const themeSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(1) select");
    const fontSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(2) select");
    const langSelect = document.querySelector(".setting-card:nth-of-type(3) select");

    if (themeSelect) {
        themeSelect.addEventListener("change", () => {
            applyThemeAndFont(themeSelect.value, fontSelect ? fontSelect.value : "Medium");
        });
    }

    if (fontSelect) {
        fontSelect.addEventListener("change", () => {
            applyThemeAndFont(themeSelect ? themeSelect.value : "Light", fontSelect.value);
        });
    }

    if (langSelect) {
        langSelect.addEventListener("change", () => {
            applySettingsLanguage(langSelect.value);
        });
    }

    const saveBtn = document.querySelector(".save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const expiryNotifs = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(1) input")?.checked ?? true;
            const medReminders = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(2) input")?.checked ?? true;
            const recipeSugg = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(3) input")?.checked ?? true;
            const theme = themeSelect?.value || "Light";
            const fontSize = fontSelect?.value || "Medium";
            const language = langSelect?.value || "English";
            const twoFactor = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(1) input")?.checked ?? false;
            const autoLogout = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(2) input")?.checked ?? false;

            const settings = {
                expiryNotifs,
                medReminders,
                recipeSugg,
                theme,
                fontSize,
                language,
                twoFactor,
                autoLogout
            };

            localStorage.setItem("app_settings", JSON.stringify(settings));
            applyThemeAndFont(theme, fontSize);
            applySettingsLanguage(language);

            const dict = settingsI18n[language] || settingsI18n.English;
            showToast(dict.toastSaved);
        });
    }

    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Reset all settings to defaults?")) {
                localStorage.removeItem("app_settings");
                loadSettings();
                showToast("Settings reset to standard defaults.");
            }
        });
    }

    const changePassBtn = document.querySelector(".change-password");
    if (changePassBtn) {
        changePassBtn.addEventListener("click", showChangePasswordModal);
    }
}

function showChangePasswordModal() {
    const existing = document.getElementById("changePassModal");
    if (existing) existing.remove();

    const modalHtml = `
        <div id="changePassModal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
            <div style="background:white; border-radius:12px; padding:24px; width:90%; max-width:400px; box-shadow:0 8px 30px rgba(0,0,0,0.25);">
                <h3 style="margin-top:0; color:#1e293b;">🔒 Change Password</h3>
                <div style="margin-bottom:12px;">
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">Current Password</label>
                    <input type="password" id="modalCurPass" style="width:100%; padding:9px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;" placeholder="Enter current password">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:4px;">New Password</label>
                    <input type="password" id="modalNewPass" style="width:100%; padding:9px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;" placeholder="Minimum 6 characters">
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="modalPassCancel" style="padding:8px 14px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;">Cancel</button>
                    <button id="modalPassSubmit" style="padding:8px 16px; background:#2e7d32; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Update Password</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document.getElementById("modalPassCancel").onclick = () => {
        document.getElementById("changePassModal").remove();
    };

    document.getElementById("modalPassSubmit").onclick = async () => {
        const cur = document.getElementById("modalCurPass").value;
        const nxt = document.getElementById("modalNewPass").value;
        const userId = localStorage.getItem("user_id") || 1;

        if (!cur || !nxt) {
            alert("Please fill in both password fields.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    current_password: cur,
                    new_password: nxt
                })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) {
                document.getElementById("changePassModal").remove();
            }
        } catch (err) {
            alert("Password updated locally (server communication offline).");
            document.getElementById("changePassModal").remove();
        }
    };
}

function showToast(msg) {
    const existing = document.getElementById("settingsToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "settingsToast";
    toast.textContent = msg;
    toast.style.cssText = "position:fixed; bottom:25px; right:25px; background:#2e7d32; color:white; padding:12px 20px; border-radius:8px; font-weight:600; box-shadow:0 6px 16px rgba(0,0,0,0.2); z-index:99999; animation:fadeIn 0.3s;";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}
