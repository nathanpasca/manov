// File: src/controllers/adminController.js

const userService = require('../services/userService');
const prisma = require('../lib/prisma');

/**
 * (Admin) Lists all users with pagination and filtering.
 */
async function listAllUsers(req, res, next) {
  try {
    const { page, limit, isActive, isAdmin, sortBy, sortOrder } = req.query;

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive; // Validator should have converted to boolean
    if (isAdmin !== undefined) filters.isAdmin = isAdmin; // Validator should have converted to boolean

    const pagination = {};
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
      pagination.skip = (pageNum - 1) * limitNum;
    } else if (!isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
    }

    const orderBy = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Assumes userService.getAllUsersAdmin can be modified or complemented to get totalCount
    // Option 1: Modify getAllUsersAdmin to return { results, totalCount }
    // const data = await userService.getAllUsersAdmin(filters, pagination, orderBy);
    // const users = data.results;
    // const totalCount = data.totalCount;

    // Option 2: Separate calls (if getAllUsersAdmin only returns array)
    const users = await userService.getAllUsersAdmin(
      filters,
      pagination,
      orderBy
    );
    const totalCount = await prisma.user.count({ where: filters }); // Or a new service function userService.countAllAdminUsers(filters)

    res.status(200).json({
      results: users,
      totalCount,
      page: pageNum || 1,
      limit: limitNum || users.length,
      totalPages: limitNum ? Math.ceil(totalCount / limitNum) : 1,
    });
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
      return res
        .status(404)
        .json({ message: `User with ID ${userId} not found.` });
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
    if (
      error.message.includes('already taken') ||
      error.message.includes('already registered')
    ) {
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
      return res.status(403).json({
        message:
          'Administrators cannot deactivate their own account through this endpoint.',
      });
    }

    const result = await userService.deleteUserByAdmin(userId); // This currently soft deletes
    res.status(200).json({
      message: `User with ID ${userId} has been deactivated.`,
      user: result,
    });
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
