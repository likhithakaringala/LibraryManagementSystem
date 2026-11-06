
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "library.db");

let db;

async function initializeDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create a new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create Admin table
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    // Create Books table
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT,
            isbn TEXT UNIQUE,
            quantity INTEGER NOT NULL DEFAULT 1,
            available INTEGER NOT NULL DEFAULT 1
        )
    `);

    // Create Students table
    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT
        )
    `);

    // Create Book Issues table
    db.run(`
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            return_date TEXT,
            fine REAL DEFAULT 0,
            status TEXT DEFAULT 'Issued',
            FOREIGN KEY (book_id) REFERENCES books(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    `);

    saveDatabase();

    console.log("Library database initialized successfully.");
    console.log("Tables created: admins, books, students, issues.");
}

function saveDatabase() {
    if (!db) {
        throw new Error("Database is not initialized.");
    }

    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

function getDatabase() {
    if (!db) {
        throw new Error("Database is not initialized.");
    }

    return db;
}

module.exports = {
    initializeDatabase,
    getDatabase,
    saveDatabase
};
