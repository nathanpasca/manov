// File: src/routes/searchRoutes.js

const express = require('express');
const searchController = require('../controllers/searchController');
const { validateSearchQuery } = require('../validators/searchValidators');
// No specific auth needed for public search, but can be added if desired
// const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/v1/search - Perform a search
router.get('/',
  validateSearchQuery, // Validates query parameters q, type, page, limit
  searchController.searchContent
);

module.exports = router;