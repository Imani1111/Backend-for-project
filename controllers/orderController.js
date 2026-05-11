const db = require("../config/db");

// CREATE ORDER FROM CART
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. get cart
        const [cart] = await db.execute(
            "SELECT * FROM cart WHERE user_id = ?",
            [userId]
        );

        if (cart.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 2. calculate total
        const total = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // 3. insert order
        const [orderResult] = await db.execute(
            "INSERT INTO orders (user_id, total) VALUES (?, ?)",
            [userId, total]
        );

        const orderId = orderResult.insertId;

        // 4. insert order items
        for (let item of cart) {
            await db.execute(
                `INSERT INTO order_items 
        (order_id, product_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.name,
                    item.price,
                    item.quantity,
                ]
            );
        }

        // 5. clear cart
        await db.execute("DELETE FROM cart WHERE user_id = ?", [
            userId,
        ]);

        res.json({
            message: "Order created successfully",
            orderId,
            total,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ORDERS
exports.getOrders = async (req, res) => {
    try {
        let query, params;

        // Admin can see all orders, regular users see only their own
        if (req.user.role === 'admin') {
            query = "SELECT * FROM orders ORDER BY created_at DESC";
            params = [];
        } else {
            const userId = req.user.userId;
            query = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
            params = [userId];
        }

        const [orders] = await db.execute(query, params);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};