// File: src/routes/novelRoutes.js

const express = require('express');
const novelController = require('../controllers/novelController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware'); // Import middleware

const router = express.Router();

// GET /api/v1/novels - Get all novels (Public)
router.get('/', novelController.getAllNovels);

// POST /api/v1/novels - Create a new novel (Admin only)
router.post('/', requireAuth, requireAdmin, novelController.createNovel);

// GET /api/v1/novels/:identifier - Get a specific novel by ID or slug (Public)
router.get('/:identifier', novelController.getNovelByIdentifier);

// PUT /api/v1/novels/:novelId - Update a novel (Admin only)
router.put('/:novelId', requireAuth, requireAdmin, novelController.updateNovel);

// DELETE /api/v1/novels/:novelId - Delete a novel (Admin only)
router.delete(
  '/:novelId',
  requireAuth,
  requireAdmin,
  novelController.deleteNovel
);

module.exports = router;
