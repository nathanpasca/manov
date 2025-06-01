// File: src/routes/languageRoutes.js

const express = require('express');
const languageController = require('../controllers/languageController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware'); // Import middleware

const router = express.Router();

// GET /api/v1/languages - Get all languages (Public)
router.get('/', languageController.getAllLanguages);

// POST /api/v1/languages - Create a new language (Admin only)
router.post('/', requireAuth, requireAdmin, languageController.createLanguage);

// GET /api/v1/languages/:languageId - Get a specific language (Public)
router.get('/:languageId', languageController.getLanguageById);

// PUT /api/v1/languages/:languageId - Update a language (Admin only)
router.put(
  '/:languageId',
  requireAuth,
  requireAdmin,
  languageController.updateLanguage
);

// DELETE /api/v1/languages/:languageId - Delete a language (Admin only)
router.delete(
  '/:languageId',
  requireAuth,
  requireAdmin,
  languageController.deleteLanguage
);

module.exports = router;
