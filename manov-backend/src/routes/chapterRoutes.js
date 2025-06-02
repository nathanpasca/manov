// File: src/routes/chapterRoutes.js

const express = require('express');
const chapterController = require('../controllers/chapterController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const {
    validateChapterCreation,
    validateChapterUpdate,
    validateNovelIdParamForChapters,
    validateChapterIdParam,
    validateChapterNumberParam
} = require('../validators/chapterValidators');
// Import lang and pagination validators and the error handler
const {
    validateLangQueryParam,
    validatePaginationQuery, // For listing chapters
    handleValidationErrors
} = require('../validators/queryValidators');

const router = express.Router(); // For routes like /chapters/:chapterId
const novelChapterRouter = express.Router({ mergeParams: true }); // For routes like /novels/:novelId/chapters

// --- Routes for chapters under a specific novel ---

// POST /api/v1/novels/:novelId/chapters - Create a new chapter for a novel
novelChapterRouter.post('/',
    requireAuth,
    requireAdmin,
    validateNovelIdParamForChapters, // Validates :novelId from parent router path
    validateChapterCreation,       // Validates req.body
    chapterController.createChapter
);

// GET /api/v1/novels/:novelId/chapters - Get all chapters for a novel
// Handles query params like ?lang=en&page=1&limit=10&isPublished=true&sortBy=chapterNumber&sortOrder=asc
novelChapterRouter.get('/',
    validateNovelIdParamForChapters, // Validates :novelId
    validateLangQueryParam,          // Validates 'lang' query param
    validatePaginationQuery,       // Validates 'page' & 'limit'
    // You can add more query validators here for isPublished, sortBy, sortOrder if needed
    handleValidationErrors,          // Handles any validation errors from param/query validators
    chapterController.getChaptersByNovelId
);

// GET /api/v1/novels/:novelId/chapters/:chapterNumber - Get specific chapter by novel and number
// Handles query params like ?lang=en
novelChapterRouter.get('/:chapterNumber',
    validateNovelIdParamForChapters, // Validates :novelId
    validateChapterNumberParam,      // Validates :chapterNumber
    validateLangQueryParam,          // Validates 'lang' query param
    handleValidationErrors,          // Handles any validation errors from param/query validators
    chapterController.getChapterByNovelAndNumber
);


// --- Routes for operating on a specific chapter by its own ID ---

// GET /api/v1/chapters/:chapterId - Get a specific chapter
// Handles query params like ?lang=en
router.get('/:chapterId',
    validateChapterIdParam,      // Validates :chapterId
    validateLangQueryParam,      // Validates 'lang' query param
    handleValidationErrors,      // Handles any validation errors from param/query validators
    chapterController.getChapterById
);

// PUT /api/v1/chapters/:chapterId - Update a chapter
router.put('/:chapterId',
    requireAuth,
    requireAdmin,
    validateChapterIdParam,      // Validates :chapterId
    validateChapterUpdate,       // Validates req.body
    chapterController.updateChapter
);

// DELETE /api/v1/chapters/:chapterId - Delete a chapter
router.delete('/:chapterId',
    requireAuth,
    requireAdmin,
    validateChapterIdParam,      // Validates :chapterId
    chapterController.deleteChapter
);

module.exports = {
    router, // for /chapters/:chapterId endpoints
    novelChapterRouter // for /novels/:novelId/chapters endpoints
};