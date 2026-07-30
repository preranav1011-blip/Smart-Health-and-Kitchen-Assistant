document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const loginData = {

        email: document.getElementById("email").value,
        password: document.getElementById("password").value

    };

    try {

        const response = await fetch("http://127.0.0.1:5000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)

        });

        const result = await response.json();

        alert(result.message);

        if (response.ok) {

            window.location.href = "home.html";

        }

    } catch (error) {

        alert("Unable to connect to server");

    }

});