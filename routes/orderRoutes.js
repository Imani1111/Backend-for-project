const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const controller = require("../controllers/orderController");

router.post("/create", verifyToken, controller.createOrder);
router.get("/", verifyToken, controller.getOrders);

module.exports = router;