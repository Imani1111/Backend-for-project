const db = require("../config/db");

// GET CART
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const cleanParam = (val) => (val === undefined ? null : val);
        const [rows] = await db.execute(
            "SELECT * FROM cart WHERE user_id = ?",
            [cleanParam(userId)]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack, debug: { product, userId } });
    }
};

// ADD TO CART
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product } = req.body;

        if (!product) {
            return res.status(400).json({ error: "Product is missing in request" });
        }

        const cleanParam = (val) => (val === undefined ? null : val);

        const productId = product.id || product._id;
        if (!productId) {
            return res.status(400).json({ error: "Product ID is missing (neither id nor _id found)" });
        }

        const params = [cleanParam(userId), cleanParam(productId)];

        const [existing] = await db.execute(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
            params
        );

        if (existing.length > 0) {
            await db.execute(
                "UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?",
                [cleanParam(userId), cleanParam(productId)]
            );
        } else {
            const insertParams = [
                cleanParam(userId),
                cleanParam(productId),
                cleanParam(product.name),
                cleanParam(product.price),
                cleanParam(product.image),
                1,
            ];

            await db.execute(
                `INSERT INTO cart (user_id, product_id, name, price, image, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
                insertParams
            );
        }

        res.json({ message: "Added to cart" });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack, debug: { product, userId } });
    }
};

// UPDATE QTY
exports.updateCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product_id, quantity } = req.body;
        const cleanParam = (val) => (val === undefined ? null : val);

        await db.execute(
            "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
            [cleanParam(quantity), cleanParam(userId), cleanParam(product_id)]
        );

        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack, debug: { product, userId } });
    }
};

// REMOVE ITEM
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { product_id } = req.params;

        const cleanParam = (val) => (val === undefined ? null : val);
        await db.execute(
            "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
            [cleanParam(userId), cleanParam(product_id)]
        );

        res.json({ message: "Removed" });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack, debug: { product, userId } });
    }
};