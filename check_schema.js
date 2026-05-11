const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute('DESCRIBE cart');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
