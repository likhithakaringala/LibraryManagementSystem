
const {
    initializeDatabase,
    getDatabase
} = require("./db");

async function testDatabase() {
    try {
        await initializeDatabase();

        const db = getDatabase();

        const result = db.exec(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
        `);

        console.log("Database tables:");

        if (result.length > 0) {
            result[0].values.forEach(row => {
                console.log("PASS:", row[0]);
            });
        }

        console.log("Database test completed successfully.");
    } catch (error) {
        console.error("Database test failed:", error.message);
        process.exitCode = 1;
    }
}

testDatabase();
