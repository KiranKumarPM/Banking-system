const User = require('../models/User');

// Signup: create a user with name and pin
async function signup(req, res) {
    try {
        const { name, pin } = req.body;
        if (!name || !pin) {
            return res.status(400).json({ message: 'Name and PIN are required' });
        }

        // Check if user exists by name
        const existing = await User.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name: name.trim(), pin: String(pin), balance: 1000 });
        return res.status(201).json({
            message: 'Signup successful',
            user: { id: user._id, name: user.name, balance: user.balance },
        });
    } catch (err) {
        console.error('Signup error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// Login: validate name and pin
async function login(req, res) {
    try {
        const { name, pin } = req.body;
        if (!name || !pin) {
            return res.status(400).json({ message: 'Name and PIN are required' });
        }
        const user = await User.findOne({ name: name.trim(), pin: String(pin) });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        return res.json({ message: 'Login successful', user: { id: user._id, name: user.name, balance: user.balance } });
    } catch (err) {
        console.error('Login error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { signup, login };

// Get full user details (safe: excludes PIN)
async function getUserDetails(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const createdAtIST = user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;
        const updatedAtIST = user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null;
        return res.json({
            user: {
                id: user._id,
                name: user.name,
                balance: user.balance,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                createdAtIST,
                updatedAtIST,
            },
        });
    } catch (err) {
        console.error('Get user details error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// List all users (safe: excludes PIN)
async function listUsers(req, res) {
    try {
        const users = await User.find({});
        return res.json({
            users: users.map((u) => ({
                id: u._id,
                name: u.name,
                balance: u.balance,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                createdAtIST: u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
                updatedAtIST: u.updatedAt ? new Date(u.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
            })),
        });
    } catch (err) {
        console.error('List users error', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports.getUserDetails = getUserDetails;
module.exports.listUsers = listUsers;


