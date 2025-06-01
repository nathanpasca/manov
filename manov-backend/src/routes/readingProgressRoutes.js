// File: src/routes/readingProgressRoutes.js

const express = require('express');
const readingProgressController = require('../controllers/readingProgressController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Router for progress related to a specific novel (will be mounted under /novels/:novelId/progress)
const novelScopedProgressRouter = express.Router({ mergeParams: true });
// mergeParams: true is crucial here so this router can access :novelId from the parent route

// PUT /api/v1/novels/:novelId/progress - Save/update progress for this novel for the authenticated user
novelScopedProgressRouter.put('/', requireAuth, readingProgressController.saveOrUpdateProgress);

// GET /api/v1/novels/:novelId/progress - Get progress for this novel for the authenticated user
novelScopedProgressRouter.get('/', requireAuth, readingProgressController.getProgressForNovel);


// Router for fetching all reading progress for the authenticated user
const userScopedProgressRouter = express.Router();

// GET /api/v1/users/me/reading-progress - Get all reading progress entries for the authenticated user
userScopedProgressRouter.get('/', requireAuth, readingProgressController.getAllProgress);


module.exports = {
  novelScopedProgressRouter, // To be mounted under /novels/:novelId/progress
  userScopedProgressRouter   // To be mounted under /users/me/reading-progress
};