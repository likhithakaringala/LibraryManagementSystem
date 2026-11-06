
const issueForm = document.getElementById("issueForm");
const bookSelect = document.getElementById("bookId");
const studentSelect = document.getElementById("studentId");
const dueDateInput = document.getElementById("dueDate");
const issueMessage = document.getElementById("issueMessage");
const issuesTableBody = document.getElementById("issuesTableBody");

// Load available books
async function loadAvailableBooks() {
    try {
        const response = await fetch("/api/books");
        const data = await response.json();

        bookSelect.innerHTML = '<option value="">Select a book</option>';

        if (!data.success) {
            throw new Error(data.message || "Unable to load books");
        }

        data.books
            .filter(book => Number(book.available) > 0)
            .forEach(book => {
                const option = document.createElement("option");
                option.value = book.id;
                option.textContent =
                    `${book.title} (Available: ${book.available})`;
                bookSelect.appendChild(option);
            });

    } catch (error) {
        bookSelect.innerHTML = '<option value="">Unable to load books</option>';
        console.error(error);
    }
}

// Load students
async function loadStudents() {
    try {
        const response = await fetch("/api/students");
        const data = await response.json();

        studentSelect.innerHTML = '<option value="">Select a student</option>';

        if (!data.success) {
            throw new Error(data.message || "Unable to load students");
        }

        data.students.forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.name} (${student.email})`;
            studentSelect.appendChild(option);
        });

    } catch (error) {
        studentSelect.innerHTML =
            '<option value="">Unable to load students</option>';
        console.error(error);
    }
}

// Load issue history
async function loadIssues() {
    try {
        const response = await fetch("/api/issues");
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Unable to load issue history");
        }

        displayIssues(data.issues);

    } catch (error) {
        issuesTableBody.innerHTML =
            '<tr><td colspan="9">Unable to load issue records.</td></tr>';
        console.error(error);
    }
}

// Display issue history
function displayIssues(issues) {
    issuesTableBody.innerHTML = "";

    if (!issues || issues.length === 0) {
        issuesTableBody.innerHTML =
            '<tr><td colspan="9">No issue records found.</td></tr>';
        return;
    }

    issues.forEach(issue => {
        const row = document.createElement("tr");

        const values = [
            issue.id,
            issue.book_title,
            issue.student_name,
            issue.issue_date,
            issue.due_date,
            issue.return_date || "-",
            `₹${Number(issue.fine || 0).toFixed(2)}`,
            issue.status
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "-";
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        if (issue.status === "Issued") {
            const returnButton = document.createElement("button");
            returnButton.textContent = "Return";
            returnButton.className = "action-button";
            returnButton.addEventListener("click", () => returnBook(issue.id));
            actionCell.appendChild(returnButton);
        } else {
            actionCell.textContent = "Completed";
        }

        row.appendChild(actionCell);
        issuesTableBody.appendChild(row);
    });
}

// Issue a book
issueForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const issueData = {
        book_id: Number(bookSelect.value),
        student_id: Number(studentSelect.value),
        due_date: dueDateInput.value
    };

    try {
        const response = await fetch("/api/issues", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(issueData)
        });

        const data = await response.json();

        issueMessage.textContent = data.message ||
            (data.success ? "Book issued successfully." : "Unable to issue book.");

        if (data.success) {
            issueMessage.style.color = "green";
            issueForm.reset();
            await loadAvailableBooks();
            await loadIssues();
        } else {
            issueMessage.style.color = "red";
        }

    } catch (error) {
        issueMessage.textContent = "Server error while issuing book.";
        issueMessage.style.color = "red";
        console.error(error);
    }
});

// Return a book
async function returnBook(issueId) {
    if (!confirm("Are you sure you want to return this book?")) {
        return;
    }

    try {
        const response = await fetch(`/api/issues/return/${issueId}`, {
            method: "PUT"
        });

        const data = await response.json();

        alert(data.message || "Return request completed.");

        if (data.success) {
            await loadAvailableBooks();
            await loadIssues();
        }

    } catch (error) {
        alert("Server error while returning the book.");
        console.error(error);
    }
}

// Logout
async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST"
        });

        window.location.href = "/";
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// Initial loading
loadAvailableBooks();
loadStudents();
loadIssues();
