const express = require('express');
const router = express.Router();
const { signup, login, getUserDetails, listUsers } = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/users -> list users (safe fields)
router.get('/users', listUsers);

// GET /api/auth/users/:id -> single user details (safe fields)
router.get('/users/:id', getUserDetails);

module.exports = router;


