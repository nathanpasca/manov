// File: src/middlewares/authMiddleware.js

const passport = require('passport');

/**
 * Middleware to protect routes that require authentication.
 * It uses the 'jwt' strategy defined in passportConfig.js.
 * If authentication is successful, req.user will be populated with the authenticated user's details.
 */
function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    // Log for debugging purposes
    // console.log('Auth Middleware - Error:', err);
    // console.log('Auth Middleware - User:', user);
    // console.log('Auth Middleware - Info:', info);

    if (err) {
      // A system or unexpected error occurred during authentication
      return next(err);
    }
    if (!user) {
      // Authentication failed: token might be missing, invalid, expired, or user not found.
      // 'info' might contain details like 'No auth token' or 'jwt expired' from passport-jwt.
      let message =
        'Unauthorized: Access is denied due to invalid credentials.';
      if (info && info.message) {
        message = `Unauthorized: ${info.message}`;
      }
      return res.status(401).json({ message });
    }

    // Authentication successful, attach user to the request object
    req.user = user;
    return next(); // Proceed to the next middleware or route handler
  })(req, res, next); // Important: Call the middleware function returned by passport.authenticate
}

/**
 * Middleware to protect routes that require administrator privileges.
 * This middleware MUST be used AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  // Check if req.user is populated by requireAuth and if the user is an admin
  if (req.user && req.user.isAdmin === true) {
    return next(); // User is an admin, proceed to the next middleware or route handler
  } else {
    // User is not an admin or req.user is not populated (though requireAuth should handle that)
    return res
      .status(403)
      .json({ message: 'Forbidden: Administrator access required.' });
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
};
