// File: src/controllers/authController.js

const userService = require('../services/userService');
const passport = require('passport');
const jwt = require('jsonwebtoken');

async function registerUser(req, res, next) {
  try {
    // Input is already validated by validateUserRegistration middleware
    // The req.body might have sanitized values (e.g., normalizeEmail)
    const { username, email, password, displayName, preferredLanguage } = req.body;
    
    const user = await userService.createUser({ username, email, password, displayName, preferredLanguage });

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    // Validator should catch most input format errors.
    // Service errors (like username/email already taken) are caught here.
    if (error.message.includes('already taken') || error.message.includes('already registered')) {
      return res.status(409).json({ message: error.message });
    }
    // The service itself might throw a "Password must be at least 8 characters" if not caught by validator
    // but our validator is more specific.
    if (error.message.includes('required') || error.message.includes('Password must be')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function loginUser(req, res, next) {
  // ... (loginUser function remains the same)
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info ? info.message : 'Login failed. Incorrect credentials.' });
    }
    req.login(user, { session: false }, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      const payload = {
        sub: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      });
      return res.status(200).json({
        message: 'Login successful.',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            isAdmin: user.isAdmin,
        },
        token: `Bearer ${token}`,
      });
    });
  })(req, res, next);
}

module.exports = {
  registerUser,
  loginUser,
};