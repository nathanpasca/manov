// File: src/routes/adminRoutes.js

const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const {
  validateUserIdParamForAdmin,
  validateAdminUserUpdate,
  validateAdminListUsersQuery,
} = require('../validators/adminUserValidators');

const router = express.Router();

// All routes in this file will first pass through requireAuth and requireAdmin
router.use(requireAuth);
router.use(requireAdmin);
// This way, we don't have to add them individually to each route definition below,
// making it cleaner if all routes in this file share the same base protection.

// GET /api/v1/admin/users - List all users (Admin only)
router.get('/users',
  validateAdminListUsersQuery, // Validates query params like page, limit, isActive, isAdmin
  adminController.listAllUsers
);

// GET /api/v1/admin/users/:userId - Get details of a specific user (Admin only)
router.get('/users/:userId',
  validateUserIdParamForAdmin, // Validates the :userId path parameter
  adminController.getUserDetailsAdmin
);

// PUT /api/v1/admin/users/:userId - Update a user's details by admin (Admin only)
router.put('/users/:userId',
  validateUserIdParamForAdmin, // Validates the :userId path parameter
  validateAdminUserUpdate,     // Validates the request body
  adminController.updateUserDetailsAdmin
);

// DELETE /api/v1/admin/users/:userId - Deactivate (soft delete) a user by admin (Admin only)
router.delete('/users/:userId',
  validateUserIdParamForAdmin, // Validates the :userId path parameter
  adminController.deleteUserByAdmin
);

// You can add more admin-specific routes here later, e.g., for managing content, site settings, etc.

module.exports = router;