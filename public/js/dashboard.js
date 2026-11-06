
async function loadDashboard() {
    try {
        const response = await fetch("/api/dashboard");

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load dashboard");
        }

        const stats = data.statistics;

        document.getElementById("welcomeMessage").textContent =
            `Welcome, ${data.username}! Here is your library overview.`;

        document.getElementById("totalTitles").textContent = stats.total_titles;
        document.getElementById("totalBooks").textContent = stats.total_books;
        document.getElementById("availableBooks").textContent = stats.available_books;
        document.getElementById("totalStudents").textContent = stats.total_students;
        document.getElementById("issuedBooks").textContent = stats.issued_books;
        document.getElementById("returnedBooks").textContent = stats.returned_books;

    } catch (error) {
        document.getElementById("welcomeMessage").textContent = error.message;
    }
}

document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST"
        });

        if (response.ok) {
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        alert("Unable to connect to the server.");
    }
});

loadDashboard();
