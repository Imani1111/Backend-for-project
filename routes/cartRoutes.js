const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const controller = require("../controllers/cartController");

router.get("/", verifyToken, controller.getCart);
router.post("/add", verifyToken, controller.addToCart);
router.put("/update", verifyToken, controller.updateCart);
router.delete("/remove/:product_id", verifyToken, controller.removeFromCart);

module.exports = router;