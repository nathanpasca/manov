// File: src/routes/readingProgressRoutes.js

const express = require('express');
const readingProgressController = require('../controllers/readingProgressController');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
    validateNovelIdParamForProgress,
    validateUpsertReadingProgress,
    validatePaginationQuery
} = require('../validators/readingProgressValidators'); // <--- Import validators

// Router for progress related to a specific novel (mounted under /novels/:novelId/progress)
const novelScopedProgressRouter = express.Router({ mergeParams: true });

novelScopedProgressRouter.put('/',
    requireAuth,
    validateNovelIdParamForProgress, // Validates :novelId from parent route
    validateUpsertReadingProgress,   // Validates req.body
    readingProgressController.saveOrUpdateProgress
);

novelScopedProgressRouter.get('/',
    requireAuth,
    validateNovelIdParamForProgress, // Validates :novelId
    readingProgressController.getProgressForNovel
);

// Router for fetching all reading progress for the authenticated user
const userScopedProgressRouter = express.Router();

userScopedProgressRouter.get('/',
    requireAuth,
    validatePaginationQuery, // Validates optional page & limit query params
    readingProgressController.getAllProgress
);

module.exports = {
  novelScopedProgressRouter,
  userScopedProgressRouter
};