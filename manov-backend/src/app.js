// File: src/app.js

// Step 1: Import Core Modules
const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');

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
const {
  novelScopedCommentRouter,
  chapterScopedCommentRouter,
  commentActionRouter
} = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');

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
// Handles GET /api/v1/users/me/favorites
app.use('/api/v1/users/me/favorites', userScopedFavoritesRouter);

// Mount novel-scoped rating routes
// Handles POST, GET /api/v1/novels/:novelId/ratings
// Handles GET, DELETE /api/v1/novels/:novelId/ratings/me
app.use('/api/v1/novels/:novelId/ratings', novelScopedRatingRouter);

// Comment routes
app.use('/api/v1/novels/:novelId/comments', novelScopedCommentRouter);
app.use('/api/v1/chapters/:chapterId/comments', chapterScopedCommentRouter);
app.use('/api/v1/comments', commentActionRouter);

app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/search', searchRoutes);

// --- Swagger API Documentation Route ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Centralized Error Handling Middleware ---
// Important: This MUST be defined AFTER all other app.use() and route calls.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('--- UNHANDLED ERROR ---');
  console.error(err.name); // e.g., 'Error', 'TypeError', 'CustomError'
  console.error(err.message);
  console.error(err.stack); // Log the full error stack for debugging on the server

  // If the error object has a specific statusCode (e.g., from a custom error or a library like http-errors), use it.
  // Otherwise, default to 500 Internal Server Error.
  const statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred on the server.';

  // For client-facing errors, you might not want to expose internal error messages in production.
  // Only expose specific messages for known client errors (4xx range).
  // For 500 errors in production, a generic message is often better.
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error. Please try again later.';
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Optionally, include the error stack in development for easier debugging from client-side too
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    // You might also want to include err.name or other properties
    ...(process.env.NODE_ENV === 'development' && err.details && { details: err.details }), // For express-validator like errors if not handled before
  });
});


// --- Define Port and Start Server ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});


// Step 10: (Optional) Export the app for testing purposes
// This allows testing frameworks like Supertest to use your app instance.
// module.exports = app;
