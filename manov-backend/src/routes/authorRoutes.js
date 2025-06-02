// File: src/routes/authorRoutes.js

const express = require('express');
const authorController = require('../controllers/authorController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { 
  validateAuthorCreation, 
  validateAuthorUpdate,
  validateAuthorIdParam 
} = require('../validators/authorValidators');

const router = express.Router();

// GET /api/v1/authors - Get all authors (Public)
router.get('/', authorController.getAllAuthors);

// POST /api/v1/authors - Create a new author (Admin only)
router.post('/',
  requireAuth,
  requireAdmin,
  validateAuthorCreation,
  authorController.createAuthor
);
// GET /api/v1/authors/:authorId - Get a specific author (Public)
router.get('/:authorId',
  validateAuthorIdParam,
  authorController.getAuthorById
);
// PUT /api/v1/authors/:authorId - Update an author (Admin only)
router.put('/:authorId',
  requireAuth,
  requireAdmin,
  validateAuthorIdParam,
  validateAuthorUpdate,
  authorController.updateAuthor
);

// DELETE /api/v1/authors/:authorId - Delete an author (Admin only)
router.delete('/:authorId',
  requireAuth,
  requireAdmin,
  validateAuthorIdParam,
  authorController.deleteAuthor
);

module.exports = router;
