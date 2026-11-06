
const express = require("express");
const bcrypt = require("bcryptjs");
const { getDatabase, saveDatabase } = require("../database/db");

const router = express.Router();

// Admin login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        const db = getDatabase();

        const result = db.exec(
            "SELECT * FROM admins WHERE username = ?",
            [username]
        );

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const admin = result[0].values[0];

        const validPassword = await bcrypt.compare(
            password,
            admin[2]
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        req.session.adminId = admin[0];
        req.session.username = admin[1];

        res.json({
            success: true,
            message: "Admin login successful."
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// Check login status
router.get("/status", (req, res) => {
    res.json({
        loggedIn: !!req.session.adminId,
        username: req.session.username || null
    });
});

// Admin logout
router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

module.exports = router;
