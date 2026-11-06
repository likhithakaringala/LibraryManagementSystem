
const express = require("express");
const router = express.Router();

const {
    getDatabase,
    saveDatabase
} = require("../database/db");

// Check whether admin is logged in
function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Please login as admin first."
        });
    }

    next();
}

// Add a new student
router.post("/", requireAdmin, (req, res) => {
    try {
        const { name, email, department } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Student name and email are required."
            });
        }

        const db = getDatabase();

        db.run(
            `INSERT INTO students (name, email, department)
             VALUES (?, ?, ?)`,
            [name.trim(), email.trim(), department || null]
        );

        saveDatabase();

        res.status(201).json({
            success: true,
            message: "Student added successfully."
        });
    } catch (error) {
        if (error.message.includes("UNIQUE")) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// View all students
router.get("/", requireAdmin, (req, res) => {
    try {
        const db = getDatabase();

        const result = db.exec(
            "SELECT * FROM students ORDER BY id DESC"
        );

        const students = result.length
            ? result[0].values.map(row => ({
                id: row[0],
                name: row[1],
                email: row[2],
                department: row[3]
            }))
            : [];

        res.json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Search students by name, email, or department
router.get("/search", requireAdmin, (req, res) => {
    try {
        const search = req.query.q || "";
        const db = getDatabase();

        const result = db.exec(
            `SELECT * FROM students
             WHERE name LIKE ?
                OR email LIKE ?
                OR department LIKE ?
             ORDER BY id DESC`,
            [
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            ]
        );

        const students = result.length
            ? result[0].values.map(row => ({
                id: row[0],
                name: row[1],
                email: row[2],
                department: row[3]
            }))
            : [];

        res.json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update student details
router.put("/:id", requireAdmin, (req, res) => {
    try {
        const { name, email, department } = req.body;
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0 || !name || !email) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID, name, and email are required."
            });
        }

        const db = getDatabase();

        db.run(
            `UPDATE students
             SET name = ?, email = ?, department = ?
             WHERE id = ?`,
            [name.trim(), email.trim(), department || null, id]
        );

        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        saveDatabase();

        res.json({
            success: true,
            message: "Student updated successfully."
        });
    } catch (error) {
        if (error.message.includes("UNIQUE")) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete a student
router.delete("/:id", requireAdmin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid student ID is required."
            });
        }

        const db = getDatabase();

        db.run(
            "DELETE FROM students WHERE id = ?",
            [id]
        );

        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        saveDatabase();

        res.json({
            success: true,
            message: "Student deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
