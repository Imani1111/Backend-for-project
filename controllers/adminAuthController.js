const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;


const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });


        const [rows] = await db.execute("SELECT * FROM admins WHERE email = ?", [email]);
        if (rows.length === 0)
            return res.status(401).json({ message: "Invalid email or password" });

        const admin = rows[0];


        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: "admin" },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: "Name, email, and password required" });

        const [existing] = await db.execute("SELECT * FROM admins WHERE email = ?", [email]);
        if (existing.length > 0)
            return res.status(400).json({ message: "Admin already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: "Admin created successfully", adminId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1]; // Bearer <token>

        if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

        const decoded = jwt.verify(token, JWT_SECRET);

        // Ensure token has admin role
        if (!decoded.role || decoded.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        req.admin = decoded; // attach decoded token to request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = { createAdmin, adminLogin, verifyAdminToken };