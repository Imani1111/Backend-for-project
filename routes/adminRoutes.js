const express = require('express');

const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

router.post("/create-admin", adminAuthController.createAdmin);
router.post("/admin-login", adminAuthController.adminLogin);

// Token verification route for AdminRoute
router.get("/dashboard", adminAuthController.verifyAdminToken, (req, res) => {
    res.status(200).json({ message: "Authorized", admin: req.admin });
});


module.exports = router;