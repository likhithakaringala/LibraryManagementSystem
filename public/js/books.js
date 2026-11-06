
const bookForm = document.getElementById("bookForm");
const booksTableBody = document.getElementById("booksTableBody");
const bookMessage = document.getElementById("bookMessage");
const searchBook = document.getElementById("searchBook");

let allBooks = [];

async function loadBooks(query = "") {
    try {
        const url = query
            ? `/api/books/search?q=${encodeURIComponent(query)}`
            : "/api/books";

        const response = await fetch(url);
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load books");
        }

        allBooks = data.books || [];
        displayBooks(allBooks);

    } catch (error) {
        bookMessage.style.color = "red";
        bookMessage.textContent = error.message;
    }
}

function displayBooks(books) {
    booksTableBody.innerHTML = "";

    if (books.length === 0) {
        booksTableBody.innerHTML =
            '<tr><td colspan="8">No books found.</td></tr>';
        return;
    }

    books.forEach(book => {
        const row = document.createElement("tr");

        const values = [
            book.id,
            book.title,
            book.author,
            book.category || "-",
            book.isbn || "-",
            book.quantity,
            book.available
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
        editButton.addEventListener("click", () => editBook(book.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "action-button delete-button";
        deleteButton.addEventListener("click", () => deleteBook(book.id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);

        booksTableBody.appendChild(row);
    });
}

bookForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("bookId").value;

    const book = {
        title: document.getElementById("title").value.trim(),
        author: document.getElementById("author").value.trim(),
        category: document.getElementById("category").value.trim(),
        isbn: document.getElementById("isbn").value.trim(),
        quantity: Number(document.getElementById("quantity").value)
    };

    try {
        const response = await fetch(
            id ? `/api/books/${id}` : "/api/books",
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(book)
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to save book");
        }

        bookMessage.style.color = "green";
        bookMessage.textContent = data.message;

        resetForm();
        loadBooks();

    } catch (error) {
        bookMessage.style.color = "red";
        bookMessage.textContent = error.message;
    }
});

function editBook(id) {
    const book = allBooks.find(item => item.id === id);
    if (!book) return;

    document.getElementById("bookId").value = book.id;
    document.getElementById("title").value = book.title;
    document.getElementById("author").value = book.author;
    document.getElementById("category").value = book.category || "";
    document.getElementById("isbn").value = book.isbn || "";
    document.getElementById("quantity").value = book.quantity;

    document.getElementById("formTitle").textContent = "Update Book";
    document.getElementById("saveBookButton").textContent = "Update Book";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteBook(id) {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
        const response = await fetch(`/api/books/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to delete book");
        }

        bookMessage.style.color = "green";
        bookMessage.textContent = data.message;
        loadBooks();

    } catch (error) {
        bookMessage.style.color = "red";
        bookMessage.textContent = error.message;
    }
}

function resetForm() {
    bookForm.reset();
    document.getElementById("bookId").value = "";
    document.getElementById("formTitle").textContent = "Add New Book";
    document.getElementById("saveBookButton").textContent = "Add Book";
}

searchBook.addEventListener("input", () => {
    loadBooks(searchBook.value.trim());
});

async function logout() {
    const response = await fetch("/api/auth/logout", {
        method: "POST"
    });

    if (response.ok) {
        window.location.href = "/";
    }
}

loadBooks();
