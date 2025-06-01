// File: src/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/v1/auth/register - Register a new user
router.post('/register', authController.registerUser);

// POST /api/v1/auth/login - Login an existing user
router.post('/login', authController.loginUser);

module.exports = router;
