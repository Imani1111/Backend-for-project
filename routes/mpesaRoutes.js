const express = require("express");
const router = express.Router();

const { stkPush, mpesaCallback } = require("../controllers/mpesaController");

router.post("/stk", stkPush);
router.get("/callback", mpesaCallback);

module.exports = router;
