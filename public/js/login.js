
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    message.textContent = "";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            message.style.color = "green";
            message.textContent = "Login successful! Opening dashboard...";

            window.location.href = "/dashboard.html";
        } else {
            message.style.color = "red";
            message.textContent = data.message || "Invalid username or password.";
        }

    } catch (error) {
        message.style.color = "red";
        message.textContent = "Unable to connect to the server.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});
