// File: src/controllers/authController.js

const userService = require('../services/userService');
const jwt = require('jsonwebtoken'); // Will be used for login in Phase 3
const passport = require('passport'); // Will be used for login in Phase 3

async function registerUser(req, res, next) {
  try {
    // Basic validation: Ensure required fields are present.
    // More comprehensive validation (e.g., email format, password complexity) in Phase 8.
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Username, email, and password are required.' });
    }

    // The userService.createUser handles hashing and specific field selections.
    const user = await userService.createUser({
      username,
      email,
      password,
      displayName,
      preferredLanguage: req.body.preferredLanguage,
    });

    // For registration, we usually don't log the user in immediately unless specified.
    // We just confirm creation. Login is a separate step.
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        // Send back non-sensitive user info
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    if (
      error.message.includes('required') ||
      error.message.includes('Password must be')
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (
      error.message.includes('already taken') ||
      error.message.includes('already registered')
    ) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    next(error); // Pass other errors to the centralized handler
  }
}

async function loginUser(req, res, next) {
  // Use passport.authenticate with the 'local' strategy.
  // { session: false } ensures no session is created as we're using JWTs.
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      // A system error occurred during authentication
      return next(err);
    }
    if (!user) {
      // Authentication failed (e.g., incorrect credentials)
      // 'info' might contain a message like 'Incorrect email or password.' from LocalStrategy
      return res.status(401).json({
        message: info ? info.message : 'Login failed. Incorrect credentials.',
      });
    }

    // If authentication is successful, 'user' object is returned by LocalStrategy.
    // Now, create and sign a JWT.
    req.login(user, { session: false }, (loginErr) => {
      // passport's req.login, though not strictly needed for JWT token signing
      if (loginErr) {
        return next(loginErr);
      }

      const payload = {
        sub: user.id, // Standard JWT claim for subject (user ID)
        username: user.username,
        isAdmin: user.isAdmin,
        // You can add other non-sensitive data to the payload if needed
      };

      // Sign the token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Token expiration time (e.g., 1 hour, 7 days)
      });

      return res.status(200).json({
        message: 'Login successful.',
        user: {
          // Return some user info along with the token
          id: user.id,
          username: user.username,
          email: user.email, // Assuming email was used for login and user object has it
          displayName: user.displayName,
          isAdmin: user.isAdmin,
        },
        token: `Bearer ${token}`,
      });
    });
  })(req, res, next); // Important: Call the middleware function returned by passport.authenticate
}

module.exports = {
  registerUser,
  loginUser, // Export the new login function
};
