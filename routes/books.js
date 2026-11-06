
const express = require("express");
const { getDatabase, saveDatabase } = require("../database/db");

const router = express.Router();

// Admin authentication
function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }
    next();
}

// Add book
router.post("/", requireAdmin, (req, res) => {
    try {
        const { title, author, category, isbn, quantity } = req.body;

        if (!title || !author || !category || !isbn || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "All book details are required."
            });
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty < 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid quantity."
            });
        }

        const db = getDatabase();

db.run(
    `INSERT INTO books
     (title, author, category, isbn, quantity, available)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
        title.trim(),
        author.trim(),
        category.trim(),
        isbn.trim(),
        qty,
        qty
    ]
);
        saveDatabase();

        res.status(201).json({
            success: true,
            message: "Book added successfully."
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Unable to add book. Check whether the ISBN already exists."
        });
    }
});

// Search books
router.get("/search", requireAdmin, (req, res) => {
    try {
        const keyword = (req.query.q || "").trim();

        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: "Enter a search keyword."
            });
        }

        const db = getDatabase();
        const searchTerm = `%${keyword}%`;

        const result = db.exec(
            `SELECT * FROM books
             WHERE title LIKE ?
                OR author LIKE ?
                OR category LIKE ?
                OR isbn LIKE ?
             ORDER BY id DESC`,
            [searchTerm, searchTerm, searchTerm, searchTerm]
        );

        let books = [];

        if (result.length > 0) {
            books = result[0].values.map(row => {
                const book = {};
                result[0].columns.forEach((column, index) => {
                    book[column] = row[index];
                });
                return book;
            });
        }

        res.json({
            success: true,
            count: books.length,
            books
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Book search failed."
        });
    }
});

// Update book
router.put("/:id", requireAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, author, category, isbn, quantity } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID."
            });
        }

        if (!title || !author || !category || !isbn || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "All book details are required."
            });
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty < 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid quantity."
            });
        }

        const db = getDatabase();

       db.run(
    `UPDATE books
     SET title = ?,
         author = ?,
         category = ?,
         isbn = ?,
         quantity = ?,
         available = ? - (
             SELECT COUNT(*)
             FROM issues
             WHERE issues.book_id = books.id
             AND issues.status = 'Issued'
         )
     WHERE id = ?`,
    [
        title.trim(),
        author.trim(),
        category.trim(),
        isbn.trim(),
        qty,
        qty,
        id
    ]
);
        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        saveDatabase();

        res.json({
            success: true,
            message: "Book updated successfully."
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Unable to update book. Check whether the ISBN already exists."
        });
    }
});

// Delete book
router.delete("/:id", requireAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID."
            });
        }

        const db = getDatabase();

        db.run("DELETE FROM books WHERE id = ?", [id]);

        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        saveDatabase();

        res.json({
            success: true,
            message: "Book deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to delete book."
        });
    }
});

// View all books
router.get("/", requireAdmin, (req, res) => {
    try {
        const db = getDatabase();
        const result = db.exec("SELECT * FROM books ORDER BY id DESC");

        let books = [];

        if (result.length > 0) {
            books = result[0].values.map(row => {
                const book = {};
                result[0].columns.forEach((column, index) => {
                    book[column] = row[index];
                });
                return book;
            });
        }

        res.json({
            success: true,
            count: books.length,
            books
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to retrieve books."
        });
    }
});

module.exports = router;
