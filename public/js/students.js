
const studentForm = document.getElementById("studentForm");
const studentsTableBody = document.getElementById("studentsTableBody");
const studentMessage = document.getElementById("studentMessage");
const searchStudent = document.getElementById("searchStudent");

let allStudents = [];

// Load students
async function loadStudents(query = "") {
    try {
        const url = query
            ? `/api/students/search?q=${encodeURIComponent(query)}`
            : "/api/students";

        const response = await fetch(url);
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load students");
        }

        allStudents = data.students || [];
        displayStudents(allStudents);

    } catch (error) {
        studentMessage.style.color = "red";
        studentMessage.textContent = error.message;
    }
}

// Display students
function displayStudents(students) {
    studentsTableBody.innerHTML = "";

    if (students.length === 0) {
        studentsTableBody.innerHTML =
            '<tr><td colspan="5">No students found.</td></tr>';
        return;
    }

    students.forEach(student => {
        const row = document.createElement("tr");

        const values = [
            student.id,
            student.name,
            student.email,
            student.department || "-"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "action-button";
        editButton.addEventListener("click", () => editStudent(student.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "action-button delete-button";
        deleteButton.addEventListener("click", () => deleteStudent(student.id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);

        studentsTableBody.appendChild(row);
    });
}

// Add or update student
studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("studentId").value;

    const student = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        department: document.getElementById("department").value.trim()
    };

    try {
        const response = await fetch(
            id ? `/api/students/${id}` : "/api/students",
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to save student");
        }

        studentMessage.style.color = "green";
        studentMessage.textContent = data.message;

        resetForm();
        loadStudents();

    } catch (error) {
        studentMessage.style.color = "red";
        studentMessage.textContent = error.message;
    }
});

// Edit student
function editStudent(id) {
    const student = allStudents.find(item => item.id === id);

    if (!student) return;

    document.getElementById("studentId").value = student.id;
    document.getElementById("name").value = student.name;
    document.getElementById("email").value = student.email;
    document.getElementById("department").value =
        student.department || "";

    document.getElementById("formTitle").textContent = "Update Student";
    document.getElementById("saveStudentButton").textContent =
        "Update Student";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Delete student
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {
        const response = await fetch(`/api/students/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to delete student");
        }

        studentMessage.style.color = "green";
        studentMessage.textContent = data.message;

        loadStudents();

    } catch (error) {
        studentMessage.style.color = "red";
        studentMessage.textContent = error.message;
    }
}

// Clear form
function resetForm() {
    studentForm.reset();

    document.getElementById("studentId").value = "";
    document.getElementById("formTitle").textContent = "Add New Student";
    document.getElementById("saveStudentButton").textContent =
        "Add Student";
}

// Search students
searchStudent.addEventListener("input", () => {
    loadStudents(searchStudent.value.trim());
});

// Logout
async function logout() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST"
        });

        if (response.ok) {
            window.location.href = "/";
        }
    } catch (error) {
        alert("Unable to connect to the server.");
    }
}

// Initial load
loadStudents();
