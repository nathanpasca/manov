// File: src/controllers/adminController.js

const userService = require('../services/userService');

/**
 * (Admin) Lists all users with pagination and filtering.
 */
async function listAllUsers(req, res, next) {
  try {
    // Query parameters (page, limit, isActive, isAdmin, sortBy, sortOrder)
    // are validated by validateAdminListUsersQuery middleware.
    const { page, limit, isActive, isAdmin, sortBy, sortOrder } = req.query;

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive; // Already boolean from validator
    if (isAdmin !== undefined) filters.isAdmin = isAdmin;   // Already boolean from validator

    const pagination = {};
    if (page && limit) {
      pagination.take = limit; // Already int from validator
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit;
    }

    const orderBy = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy] = sortOrder; // e.g. { "username": "asc" }
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    const users = await userService.getAllUsersAdmin(filters, pagination, orderBy);
    // For a more complete pagination response, you might also want to fetch the total count of users.
    // const totalUsers = await userService.countAllUsersAdmin(filters);
    // res.status(200).json({ users, totalUsers, page, limit });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * (Admin) Gets details of a specific user by their ID.
 */
async function getUserDetailsAdmin(req, res, next) {
  try {
    // userId path parameter is validated by validateUserIdParamForAdmin middleware
    const { userId } = req.params;
    const user = await userService.findUserById(userId); // Reusing findUserById which selects admin-appropriate fields

    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * (Admin) Updates a specific user's details.
 */
async function updateUserDetailsAdmin(req, res, next) {
  try {
    // userId path parameter is validated by validateUserIdParamForAdmin
    // req.body is validated by validateAdminUserUpdate
    const { userId } = req.params;
    const updateData = req.body; // Contains only validated and allowed fields

    const updatedUser = await userService.updateUserByAdmin(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already taken') || error.message.includes('already registered')) {
      return res.status(409).json({ message: error.message }); // 409 Conflict for email/username
    }
    // Validator ensures 'No data provided for update' is handled before controller
    next(error);
  }
}

/**
 * (Admin) Deactivates (soft deletes) or hard deletes a user.
 * Current service implementation does a soft delete (sets isActive = false).
 */
async function deleteUserByAdmin(req, res, next) {
  try {
    // userId path parameter is validated by validateUserIdParamForAdmin
    const { userId } = req.params;

    // Ensure admin cannot deactivate themselves via this endpoint - crucial check!
    if (req.user && req.user.id === userId) {
        return res.status(403).json({ message: "Administrators cannot deactivate their own account through this endpoint." });
    }

    const result = await userService.deleteUserByAdmin(userId); // This currently soft deletes
    res.status(200).json({ message: `User with ID ${userId} has been deactivated.`, user: result });
    // If it were a hard delete, res.status(204).send(); would be more appropriate.
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  listAllUsers,
  getUserDetailsAdmin,
  updateUserDetailsAdmin,
  deleteUserByAdmin,
};