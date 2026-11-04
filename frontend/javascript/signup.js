const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://smart-health-and-kitchen-assistant.onrender.com';
document.getElementById("signupForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const user = {
        name: username,
        email: email,
        password: password
    };

    try {

        const response = await fetch(`${API_BASE}/signup`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(user)

        });

        const result = await response.json();

        alert(result.message);

        if (response.ok) {
            alert(result.message);

            setTimeout(() => {
                window.open("login.html", "_self");
            }, 100);
        }

    } catch (error) {

        alert("Unable to connect to server");

    }

});