document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.querySelector(".logout");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();

            // Remove login information
            localStorage.removeItem("user_id");
            localStorage.removeItem("user_name");

            // Redirect to login page
            window.location.href = "login.html";
        });
    }

});