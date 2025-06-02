// File: src/routes/novelRoutes.js

const express = require('express');
const novelController = require('../controllers/novelController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { 
  validateNovelCreation, 
  validateNovelUpdate,
  validateNovelIdentifierParam,
  validateNovelIdParam
} = require('../validators/novelValidators');

const router = express.Router();

// GET /api/v1/novels - Get all novels (Public)
router.get('/', novelController.getAllNovels);

// POST /api/v1/novels - Create a new novel (Admin only)
router.post('/',
  requireAuth,
  requireAdmin,
  validateNovelCreation,
  novelController.createNovel
);

// GET /api/v1/novels/:identifier - Get a specific novel by ID or slug (Public)
router.post('/',
  requireAuth,
  requireAdmin,
  validateNovelCreation,
  novelController.createNovel
);

// PUT /api/v1/novels/:novelId - Update a novel (Admin only)
router.put('/:novelId',
  requireAuth,
  requireAdmin,
  validateNovelIdParam,
  validateNovelUpdate,
  novelController.updateNovel
);

// DELETE /api/v1/novels/:novelId - Delete a novel (Admin only)
router.delete('/:novelId',
  requireAuth,
  requireAdmin,
  validateNovelIdParam,
  novelController.deleteNovel
);

module.exports = router;
