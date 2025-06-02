// File: src/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const { validateUserRegistration, validateUserLogin } = require('../validators/userValidators');

const router = express.Router();

// POST /api/v1/auth/register - Register a new user
router.post('/register',
    validateUserRegistration,
    authController.registerUser
);

// POST /api/v1/auth/login - Login an existing user
// We can add login validation later if needed (e.g. email format, password not empty)
router.post('/login', validateUserLogin, authController.loginUser);

module.exports = router;