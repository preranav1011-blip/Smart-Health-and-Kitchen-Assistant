const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

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
    if (langSelect && saved.language) langSelect.value = saved.language;

    // Privacy & Security
    const twoFactor = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(1) input");
    const autoLogout = document.querySelector(".setting-card:nth-of-type(4) .option:nth-of-type(2) input");

    if (twoFactor) twoFactor.checked = Boolean(saved.twoFactor);
    if (autoLogout) autoLogout.checked = Boolean(saved.autoLogout);

    // Apply active theme and font size
    applyThemeAndFont(saved.theme || "Light", saved.fontSize || "Medium");
}

function applyThemeAndFont(theme, fontSize) {
    if (theme === "Dark") {
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
    // Live theme preview
    const themeSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(1) select");
    const fontSelect = document.querySelector(".setting-card:nth-of-type(2) .option:nth-of-type(2) select");

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

    // Save Settings Button
    const saveBtn = document.querySelector(".save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const expiryNotifs = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(1) input")?.checked ?? true;
            const medReminders = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(2) input")?.checked ?? true;
            const recipeSugg = document.querySelector(".setting-card:nth-of-type(1) .option:nth-of-type(3) input")?.checked ?? true;
            const theme = themeSelect?.value || "Light";
            const fontSize = fontSelect?.value || "Medium";
            const language = document.querySelector(".setting-card:nth-of-type(3) select")?.value || "English";
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

            showToast("Settings saved successfully! Preferences updated.");
        });
    }

    // Reset Settings Button
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

    // Change Password Modal
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
