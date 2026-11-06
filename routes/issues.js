
const express = require("express");
const router = express.Router();

const {
    getDatabase,
    saveDatabase
} = require("../database/db");

// Admin authentication
function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Please login as admin first."
        });
    }

    next();
}

// Issue a book to a student
router.post("/", requireAdmin, (req, res) => {
    try {
        const { book_id, student_id, due_date } = req.body;

        if (
            !Number.isInteger(Number(book_id)) ||
            Number(book_id) <= 0 ||
            !Number.isInteger(Number(student_id)) ||
            Number(student_id) <= 0 ||
            !due_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid book ID, student ID, and due date are required."
            });
        }

        const db = getDatabase();

        // Check whether book exists and is available
        const bookResult = db.exec(
            "SELECT id, quantity, available FROM books WHERE id = ?",
            [Number(book_id)]
        );

        if (!bookResult.length || bookResult[0].values.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        const book = bookResult[0].values[0];

        if (Number(book[2]) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Book is currently unavailable."
            });
        }

        // Check whether student exists
        const studentResult = db.exec(
            "SELECT id FROM students WHERE id = ?",
            [Number(student_id)]
        );

        if (!studentResult.length || studentResult[0].values.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const issueDate = new Date().toISOString().split("T")[0];

        if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
            return res.status(400).json({
                success: false,
                message: "Due date must use YYYY-MM-DD format."
            });
        }

        if (due_date < issueDate) {
            return res.status(400).json({
                success: false,
                message: "Due date cannot be before the issue date."
            });
        }

        // Create issue record
        db.run(
            `INSERT INTO issues
             (book_id, student_id, issue_date, due_date, status)
             VALUES (?, ?, ?, ?, 'Issued')`,
            [
                Number(book_id),
                Number(student_id),
                issueDate,
                due_date
            ]
        );

        // Reduce available book quantity
        db.run(
            "UPDATE books SET available = available - 1 WHERE id = ?",
            [Number(book_id)]
        );

        saveDatabase();

        res.status(201).json({
            success: true,
            message: "Book issued successfully.",
            issue_date: issueDate,
            due_date
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// View all issued and returned books
router.get("/", requireAdmin, (req, res) => {
    try {
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                issues.id,
                books.title,
                students.name,
                issues.issue_date,
                issues.due_date,
                issues.return_date,
                issues.fine,
                issues.status
            FROM issues
            JOIN books ON issues.book_id = books.id
            JOIN students ON issues.student_id = students.id
            ORDER BY issues.id DESC
        `);

        const issues = result.length
            ? result[0].values.map(row => ({
                id: row[0],
                book_title: row[1],
                student_name: row[2],
                issue_date: row[3],
                due_date: row[4],
                return_date: row[5],
                fine: row[6],
                status: row[7]
            }))
            : [];

        res.json({
            success: true,
            count: issues.length,
            issues
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// View issues for a particular student
router.get("/student/:studentId", requireAdmin, (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID is required."
            });
        }

        const db = getDatabase();

        const result = db.exec(
            `SELECT
                issues.id,
                books.title,
                issues.issue_date,
                issues.due_date,
                issues.return_date,
                issues.fine,
                issues.status
             FROM issues
             JOIN books ON issues.book_id = books.id
             WHERE issues.student_id = ?
             ORDER BY issues.id DESC`,
            [studentId]
        );

        const issues = result.length
            ? result[0].values.map(row => ({
                id: row[0],
                book_title: row[1],
                issue_date: row[2],
                due_date: row[3],
                return_date: row[4],
                fine: row[5],
                status: row[6]
            }))
            : [];

        res.json({
            success: true,
            count: issues.length,
            issues
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Return a book
router.put("/return/:id", requireAdmin, (req, res) => {
    try {
        const issueId = Number(req.params.id);

        if (!Number.isInteger(issueId) || issueId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid issue ID is required."
            });
        }

        const db = getDatabase();

        const result = db.exec(
            `SELECT book_id, due_date, status
             FROM issues
             WHERE id = ?`,
            [issueId]
        );

        if (!result.length || result[0].values.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Issue record not found."
            });
        }

        const [bookId, dueDate, status] = result[0].values[0];

        if (status === "Returned") {
            return res.status(400).json({
                success: false,
                message: "This book has already been returned."
            });
        }

        const returnDate = new Date().toISOString().split("T")[0];

        // Calculate fine: Rs. 5 per day after due date
        const due = new Date(dueDate + "T00:00:00Z");
        const returned = new Date(returnDate + "T00:00:00Z");

        const lateDays = Math.max(
            0,
            Math.floor((returned - due) / (1000 * 60 * 60 * 24))
        );

        const fine = lateDays * 5;

        db.run(
            `UPDATE issues
             SET return_date = ?, fine = ?, status = 'Returned'
             WHERE id = ?`,
            [returnDate, fine, issueId]
        );

        // Increase available book quantity
        db.run(
            "UPDATE books SET available = available + 1 WHERE id = ?",
            [bookId]
        );

        saveDatabase();

        res.json({
            success: true,
            message: "Book returned successfully.",
            return_date: returnDate,
            late_days: lateDays,
            fine
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
