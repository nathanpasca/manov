// File: src/routes/chapterRoutes.js

const express = require('express');
const chapterController = require('../controllers/chapterController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware'); // Import middleware

const router = express.Router(); // For routes like /chapters/:chapterId
const novelChapterRouter = express.Router({ mergeParams: true }); // For routes like /novels/:novelId/chapters

// --- Routes for chapters under a specific novel ---
// POST /api/v1/novels/:novelId/chapters - Create a new chapter for a novel (Admin only)
novelChapterRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  chapterController.createChapter
);
// GET /api/v1/novels/:novelId/chapters - Get all chapters for a novel (Public)
novelChapterRouter.get('/', chapterController.getChaptersByNovelId);
// GET /api/v1/novels/:novelId/chapters/:chapterNumber - Get specific chapter by novel and number (Public)
novelChapterRouter.get(
  '/:chapterNumber',
  chapterController.getChapterByNovelAndNumber
);

// --- Routes for operating on a specific chapter by its own ID ---
// GET /api/v1/chapters/:chapterId - Get a specific chapter (Public)
router.get('/:chapterId', chapterController.getChapterById);
// PUT /api/v1/chapters/:chapterId - Update a chapter (Admin only)
router.put(
  '/:chapterId',
  requireAuth,
  requireAdmin,
  chapterController.updateChapter
);
// DELETE /api/v1/chapters/:chapterId - Delete a chapter (Admin only)
router.delete(
  '/:chapterId',
  requireAuth,
  requireAdmin,
  chapterController.deleteChapter
);

module.exports = {
  router,
  novelChapterRouter,
};
