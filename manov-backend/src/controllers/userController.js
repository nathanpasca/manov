// File: src/controllers/userController.js

const userService = require('../services/userService');

// This function will require authentication middleware in Phase 3
// to get req.user populated.
async function getMyProfile(req, res, next) {
  try {
    // IMPORTANT: In Phase 3, req.user will be populated by Passport middleware.
    // For now, to test structure, you might temporarily pass a hardcoded ID
    // or expect an ID in params, but the goal is to use req.user.id.
    if (!req.user || !req.user.id) {
      // This check will be effective once auth middleware is in place.
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const userProfile = await userService.findUserById(userId);

    if (!userProfile) {
      // Should not happen if req.user.id is valid from a token, but good check.
      return res.status(404).json({ message: 'User profile not found.' });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
}

// This function will also require authentication middleware.
async function updateMyProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const profileData = req.body;

    if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ message: 'No data provided for update.' });
    }
    // Prevent users from updating their role or sensitive fields via this endpoint
    delete profileData.isAdmin;
    delete profileData.isActive; // These should be admin actions
    delete profileData.email; // Email change usually needs verification
    delete profileData.username; // Username change might be restricted

    const updatedProfile = await userService.updateUserProfile(
      userId,
      profileData
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('No profile data')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// Admin-specific user controllers (listUsers, getUserByIdAdmin, updateUserByAdmin)
// will be added in Phase 6.

module.exports = {
  getMyProfile,
  updateMyProfile,
};
