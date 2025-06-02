// File: src/controllers/userController.js

const userService = require('../services/userService');

async function getMyProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const userProfile = await userService.findUserById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    // Authentication checked by requireAuth middleware
    // Input data is validated by validateUserProfileUpdate middleware
    const userId = req.user.id;
    const profileData = req.body; // Validator ensures only allowed fields are processed based on rules
    
    // The validator already checks if at least one updatable field is provided.
    // Controller still ensures sensitive fields are not updatable through this route.
    const allowedUpdates = {};
    if (profileData.displayName !== undefined) allowedUpdates.displayName = profileData.displayName;
    if (profileData.avatarUrl !== undefined) allowedUpdates.avatarUrl = profileData.avatarUrl;
    if (profileData.preferredLanguage !== undefined) allowedUpdates.preferredLanguage = profileData.preferredLanguage;
    if (profileData.readingPreferences !== undefined) allowedUpdates.readingPreferences = profileData.readingPreferences;


    const updatedProfile = await userService.updateUserProfile(userId, allowedUpdates);
    res.status(200).json(updatedProfile);
  } catch (error) {
    // Validator catches input format errors.
    // Service errors (like user not found) are handled here.
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('No profile data')) { // From service if somehow empty object passed
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
};