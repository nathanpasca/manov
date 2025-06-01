// File: src/config/passportConfig.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const userService = require('../services/userService'); // We'll use this to find users

// --- Local Strategy for username/password login ---
passport.use(
  new LocalStrategy(
    // Passport expects 'username' and 'password' by default.
    // If your frontend sends email instead of username for login, configure it here:
    { usernameField: 'email' }, // or 'username' if you prefer to log in with username
    async (email, password, done) => {
      try {
        // 1. Find the user by email (or username)
        //    findUserByUsernameOrEmailWithPassword includes the passwordHash needed for comparison.
        const user =
          await userService.findUserByUsernameOrEmailWithPassword(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // 2. Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // 3. If passwords match, authentication is successful
        //    Return the user object (without the passwordHash for security in done callback)
        const { passwordHash, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error); // Pass any system errors to Passport
      }
    }
  )
);

// --- JWT Strategy for authenticating users via tokens ---
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts token from "Bearer <token>" in Authorization header
  secretOrKey: process.env.JWT_SECRET, // Use the secret key from your .env file
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      // jwt_payload contains the decoded JWT payload (e.g., user ID, username)
      // We use the ID (sub - subject) from the payload to find the user in our database
      const user = await userService.findUserById(jwt_payload.sub); // 'sub' is standard for user ID in JWT

      if (user) {
        // If user is found, authentication is successful
        // The 'user' object will be attached to req.user in protected routes
        return done(null, user);
      } else {
        // If user is not found (e.g., user deleted after token issuance)
        return done(null, false, { message: 'User not found.' });
      }
    } catch (error) {
      return done(error, false);
    }
  })
);

// Note: Passport can also manage sessions with serializeUser/deserializeUser,
// but for a stateless JWT-based API, this is typically not needed.
// The JWT itself contains the necessary user identification for each request.
