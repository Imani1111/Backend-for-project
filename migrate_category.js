const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function migrate() {
    try {
        console.log("Checking table schema...");
        const [columns] = await db.execute("SHOW COLUMNS FROM products");
        const hasCategory = columns.some(col => col.Field === 'category');

        if (!hasCategory) {
            console.log("Adding 'category' column to 'products' table...");
            await db.execute("ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'General'");
            console.log("Column added successfully.");
        } else {
            console.log("'category' column already exists.");
        }

    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        process.exit();
    }
}

migrate();
