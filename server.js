
const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");

const {
    initializeDatabase,
    getDatabase,
    saveDatabase
} = require("./database/db");

// Import routes
const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const studentRoutes = require("./routes/students");
const issueRoutes = require("./routes/issues");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "library-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 60 * 60 * 1000
    }
}));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/issues", issueRoutes);

// Create default admin account
async function createDefaultAdmin() {
    const db = getDatabase();

    const existing = db.exec(
        "SELECT id FROM admins WHERE username = ?",
        ["admin"]
    );

    if (existing.length === 0 || existing[0].values.length === 0) {
        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        db.run(
            "INSERT INTO admins (username, password) VALUES (?, ?)",
            ["admin", hashedPassword]
        );

        saveDatabase();

        console.log("Default admin account created.");
    } else {
        console.log("Admin account already exists.");
    }
}

// Protected dashboard API
// Protected dashboard API
app.get("/api/dashboard", (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {
        const db = getDatabase();

        const result = db.exec(`
            SELECT
                (SELECT COUNT(*) FROM books) AS total_titles,
                (SELECT COALESCE(SUM(quantity), 0) FROM books) AS total_books,
                (SELECT COALESCE(SUM(available), 0) FROM books) AS available_books,
                (SELECT COUNT(*) FROM students) AS total_students,
                (SELECT COUNT(*) FROM issues WHERE status = 'Issued') AS issued_books,
                (SELECT COUNT(*) FROM issues WHERE status = 'Returned') AS returned_books
        `);

        const values = result[0].values[0];

        res.json({
            success: true,
            message: "Dashboard statistics fetched successfully.",
            username: req.session.username,
            statistics: {
                total_titles: values[0],
                total_books: values[1],
                available_books: values[2],
                total_students: values[3],
                issued_books: values[4],
                returned_books: values[5]
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics."
        });
    }
});

// Home route
app.get("/", (req, res) => {
    res.send("Online Library Management System Backend is Running.");
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();

        await createDefaultAdmin();

        app.listen(PORT, () => {
            console.log(
                `Library Management System running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
