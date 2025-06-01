// File: src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware'); // Only requireAuth needed here for now

const router = express.Router();

// GET /api/v1/users/me - Get current authenticated user's profile
router.get('/me', requireAuth, userController.getMyProfile);

// PUT /api/v1/users/me - Update current authenticated user's profile
router.put('/me', requireAuth, userController.updateMyProfile);

// Admin routes for managing ALL users (e.g., GET /api/v1/users, GET /api/v1/users/:userId)
// will be added in Phase 6. If added here, they would need 'requireAdmin' too.

module.exports = router;
