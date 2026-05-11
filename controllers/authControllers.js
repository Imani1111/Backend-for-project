const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}


const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All field required' })
        };
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be atleast 6 characters' })
        }

        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        )

        if (existing.length > 0) {
            return res.status(409).json({ error: 'User already exists' })
        };

        const Salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, Salt);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)',
            [username, email, hashed_password]
        );

        const token = generateToken(result.insertId);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                username,
                email,
            }
        });
        console.log(req.body);

    } catch (error) {
        console.error("Error: ", error.message);
        res.status(500).json({ error: 'Error during signup' })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        };

        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        };

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.hashed_password);


        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        };

        const token = generateToken(user.id);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error: ', error.message);
        res.status(500).json({ error: 'Error logging in' });
    }
}

module.exports = { register, login };