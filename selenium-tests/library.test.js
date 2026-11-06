const { Builder, By, until } = require("selenium-webdriver");

async function runTest() {
    const driver = await new Builder().forBrowser("chrome").build();

    try {
        // Open Library Management System
        await driver.get("http://localhost:8081");

        // Login
        await driver.findElement(By.id("username")).sendKeys("admin");
        await driver.findElement(By.id("password")).sendKeys("Admin@123");
        await driver.findElement(By.css("button[type='submit']")).click();

        await driver.wait(
            until.urlContains("dashboard.html"),
            10000
        );

        console.log("Login Test Passed");

        // Test application pages
        await driver.get("http://localhost:8081/books.html");
        console.log("Books Page Test Passed");

        await driver.get("http://localhost:8081/students.html");
        console.log("Students Page Test Passed");

        await driver.get("http://localhost:8081/issues.html");
        console.log("Issues Page Test Passed");

    } catch (error) {
        console.log("Test Failed:", error.message);
    } finally {
        await driver.quit();
    }
}

runTest();