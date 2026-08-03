document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const loginData = {

        email: document.getElementById("email").value,
        password: document.getElementById("password").value

    };

    try {

        const response = await fetch("https://smart-health-and-kitchen-assistant.onrender.com/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)

        });

        const result = await response.json();

        alert(result.message);

        if (response.ok) {

            localStorage.setItem("user_id", result.user_id);
            localStorage.setItem("username", result.name);

            window.location.href = "home.html";

        }

    } catch (error) {

        alert("Unable to connect to server");

    }

});