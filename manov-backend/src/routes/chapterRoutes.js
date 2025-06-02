// File: src/routes/chapterRoutes.js

const express = require('express');
const chapterController = require('../controllers/chapterController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const {
    validateChapterCreation,
    validateChapterUpdate,
    validateNovelIdParamForChapters, // For when :novelId is in the path
    validateChapterIdParam,        // For when :chapterId is in the path
    validateChapterNumberParam     // For when :chapterNumber is in the path
} = require('../validators/chapterValidators');

const router = express.Router(); // For routes like /chapters/:chapterId
const novelChapterRouter = express.Router({ mergeParams: true }); // For routes like /novels/:novelId/chapters

// --- Routes for chapters under a specific novel ---

// POST /api/v1/novels/:novelId/chapters - Create a new chapter for a novel
novelChapterRouter.post('/',
    requireAuth,
    requireAdmin,
    validateNovelIdParamForChapters, // Validates :novelId from parent router
    validateChapterCreation,       // Validates req.body
    chapterController.createChapter
);

// GET /api/v1/novels/:novelId/chapters - Get all chapters for a novel
novelChapterRouter.get('/',
    validateNovelIdParamForChapters, // Validates :novelId
    chapterController.getChaptersByNovelId // Query param validation can be added here or in controller
);

// GET /api/v1/novels/:novelId/chapters/:chapterNumber - Get specific chapter by novel and number
novelChapterRouter.get('/:chapterNumber',
    validateNovelIdParamForChapters, // Validates :novelId
    validateChapterNumberParam,    // Validates :chapterNumber
    chapterController.getChapterByNovelAndNumber
);


// --- Routes for operating on a specific chapter by its own ID ---

// GET /api/v1/chapters/:chapterId - Get a specific chapter
router.get('/:chapterId',
    validateChapterIdParam, // Validates :chapterId
    chapterController.getChapterById
);

// PUT /api/v1/chapters/:chapterId - Update a chapter
router.put('/:chapterId',
    requireAuth,
    requireAdmin,
    validateChapterIdParam,  // Validates :chapterId
    validateChapterUpdate,   // Validates req.body
    chapterController.updateChapter
);

// DELETE /api/v1/chapters/:chapterId - Delete a chapter
router.delete('/:chapterId',
    requireAuth,
    requireAdmin,
    validateChapterIdParam, // Validates :chapterId
    chapterController.deleteChapter
);

module.exports = {
    router, // for /chapters endpoints
    novelChapterRouter // for /novels/:novelId/chapters endpoints
};