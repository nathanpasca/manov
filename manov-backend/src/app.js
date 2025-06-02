// File: src/app.js

// Step 1: Import Core Modules
const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');

const cors = require('cors');
const helmet = require('helmet');

// Step 2: Load Environment Variables
dotenv.config();
require('./config/passportConfig');

// Step 3: Initialize Express Application
const app = express();

// Step 4: Apply Essential Global Middleware
// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors()); // Enable Cross-Origin Resource Sharing - configure as needed
app.use(helmet()); // Apply various security-related HTTP headers

// Step 5: Initialize Passport.js
// Sets up Passport for handling authentication
app.use(passport.initialize());
// Note: passport.session() is not needed for stateless JWT-based API authentication.

// Step 6: Define a Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    message: 'Manov backend is healthy!',
  });
});

// Step 7: (Placeholder) Mount API Routers
const languageRoutes = require('./routes/languageRoutes');
const authorRoutes = require('./routes/authorRoutes');
const novelRoutes = require('./routes/novelRoutes'); // Router for /api/v1/novels
const {
  router: directChapterRoutes,
  novelChapterRouter: nestedChapterRoutes,
} = require('./routes/chapterRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { novelScopedProgressRouter, userScopedProgressRouter } = require('./routes/readingProgressRoutes');
const { novelFavoriteRouter, userScopedFavoritesRouter } = require('./routes/userFavoriteRoutes');
const { novelScopedRatingRouter } = require('./routes/ratingRoutes'); 




app.use('/api/v1/languages', languageRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/novels', novelRoutes); // Handles /api/v1/novels and /api/v1/novels/:identifier

// Mount routes that operate on chapters directly via their chapterId
app.use('/api/v1/chapters', directChapterRoutes);

// Mount routes that operate on chapters in context of a novel
app.use('/api/v1/novels/:novelId/chapters', nestedChapterRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
// Mount novel-scoped reading progress routes
// This will handle PUT /api/v1/novels/:novelId/progress and GET /api/v1/novels/:novelId/progress
app.use('/api/v1/novels/:novelId/progress', novelScopedProgressRouter);

// Mount user-scoped reading progress routes
// This will handle GET /api/v1/users/me/reading-progress
app.use('/api/v1/users/me/reading-progress', userScopedProgressRouter);

// Mount novel-scoped favorite routes
// Handles POST & DELETE /api/v1/novels/:novelId/favorite
app.use('/api/v1/novels/:novelId/favorite', novelFavoriteRouter);

// Mount user-scoped favorites listing route
// Handles GET /api/v1/users/me/favorites
app.use('/api/v1/users/me/favorites', userScopedFavoritesRouter);

// Mount novel-scoped rating routes
// Handles POST, GET /api/v1/novels/:novelId/ratings
// Handles GET, DELETE /api/v1/novels/:novelId/ratings/me
app.use('/api/v1/novels/:novelId/ratings', novelScopedRatingRouter);

// Step 8: (Placeholder) Centralized Error Handling Middleware
// This should be one of the last pieces of middleware you define.
// It will catch errors passed by next(err) from your route handlers.
// For example:
// app.use((err, req, res, next) => {
//   console.error(err.stack); // Log error stack for debugging
//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Internal Server Error';
//   res.status(statusCode).json({
//     status: 'error',
//     statusCode,
//     message,
//     // Optionally include stack in development
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//   });
// });

// Step 9: Define Port and Start Server
const PORT = process.env.PORT || 3001; // Use port from .env or default to 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  // Ensure your .env file has a PORT variable if you want to use something else.
});

// Step 10: (Optional) Export the app for testing purposes
// This allows testing frameworks like Supertest to use your app instance.
// module.exports = app;
