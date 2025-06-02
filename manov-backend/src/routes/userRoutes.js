// File: src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { validateUserProfileUpdate } = require('../validators/userValidators'); // <--- Import validator

const router = express.Router();

// GET /api/v1/users/me - Get current authenticated user's profile
router.get('/me',
    requireAuth,
    userController.getMyProfile
);

// PUT /api/v1/users/me - Update current authenticated user's profile
router.put('/me',
    requireAuth,
    validateUserProfileUpdate,
    userController.updateMyProfile
);

module.exports = router;