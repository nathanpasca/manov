// File: src/routes/novelRoutes.js

const express = require('express');
const novelController = require('../controllers/novelController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const {
  validateNovelCreation,
  validateNovelUpdate,
  validateNovelIdentifierParam,
  validateNovelIdParam         // For PUT/DELETE /:novelId
} = require('../validators/novelValidators');
const {
  validateLangQueryParam,
  validatePaginationQuery,
  handleValidationErrors      // To handle errors from query/param validators
} = require('../validators/queryValidators');

const router = express.Router();

// GET /api/v1/novels - Get all novels (Public)
// Handles query params like ?lang=en&page=1&limit=10&sortBy=title&sortOrder=asc
router.get('/',
  validateLangQueryParam,      // Validates 'lang' query param
  validatePaginationQuery,   // Validates 'page' & 'limit'
  // You might add more query validators here for sortBy, sortOrder, genre, etc.
  handleValidationErrors,      // Handles any validation errors from the query validators above
  novelController.getAllNovels
);

// POST /api/v1/novels - Create a new novel (Admin only)
router.post('/',
  requireAuth,
  requireAdmin,
  validateNovelCreation,     // Validates the request body for novel creation
  novelController.createNovel
);

// GET /api/v1/novels/:identifier - Get a specific novel by ID or slug (Public)
// Handles query params like ?lang=en
router.get('/:identifier',
  validateNovelIdentifierParam, // Validates the :identifier path parameter
  validateLangQueryParam,       // Validates 'lang' query param
  handleValidationErrors,       // Handles any validation errors from the above validators
  novelController.getNovelByIdentifier
);

// PUT /api/v1/novels/:novelId - Update a novel (Admin only)
router.put('/:novelId',
  requireAuth,
  requireAdmin,
  validateNovelIdParam,        // Validates the :novelId path parameter (ensures it's an int)
  validateNovelUpdate,         // Validates the request body for novel update
  novelController.updateNovel
);

// DELETE /api/v1/novels/:novelId - Delete a novel (Admin only)
router.delete('/:novelId',
  requireAuth,
  requireAdmin,
  validateNovelIdParam,        // Validates the :novelId path parameter
  novelController.deleteNovel
);

module.exports = router;