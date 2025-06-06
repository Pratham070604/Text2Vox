document.addEventListener("DOMContentLoaded", function () {
    // Password Toggle Feature
    document.querySelectorAll(".password-toggle").forEach(field => {
        const toggleBtn = field.nextElementSibling;
        if (toggleBtn?.classList.contains("toggle-btn")) {
            const showIcon = "/static/images/eye-off.png";
            const hideIcon = "/static/images/eye.png";

            toggleBtn.innerHTML = `<img src="${hideIcon}" alt="Show Password" width="20">`;

            toggleBtn.addEventListener("click", function (event) {
                event.preventDefault();
                const isPassword = field.type === "password";
                field.type = isPassword ? "text" : "password";
                toggleBtn.innerHTML = `<img src="${isPassword ? showIcon : hideIcon}" alt="${isPassword ? "Hide" : "Show"} Password" width="20">`;
            });
        }
    });

    // Function to Show Alert Below h2 Without Reload
    function showAlert(message, type) {
        // Remove existing alert if present
        document.querySelector(".alert")?.remove();

        const h2 = document.querySelector(".signup-form h2");
        if (!h2) return;

        // Create new alert
        const alertBox = document.createElement("p");
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        h2.insertAdjacentElement("afterend", alertBox);

        console.log("Alert added:", alertBox);

        // Set timer to remove alert after 3 seconds
        setTimeout(() => {
            alertBox.style.transition = "opacity 0.5s ease";
            alertBox.style.opacity = "0";
            setTimeout(() => alertBox.remove(), 500);
        }, 3000);
    }

    // Auto-remove Flash Messages After 3 Seconds
    setTimeout(function () {
        let flashMessage = document.getElementById('flash-message');
        if (flashMessage) {
            flashMessage.style.transition = "opacity 0.5s ease";
            flashMessage.style.opacity = "0";
            setTimeout(() => flashMessage.remove(), 500);
        }
    }, 3000);
});
