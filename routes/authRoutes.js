const express = require('express');

const authRoutes = require('../controllers/authControllers.js')

const router = express.Router();

router.post('/register', authRoutes.register);
router.post('/login', authRoutes.login)


module.exports = router;