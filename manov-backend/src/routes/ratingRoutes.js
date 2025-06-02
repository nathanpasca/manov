// File: src/routes/ratingRoutes.js

const express = require('express');
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
  validateNovelIdParamForRatings,
  validateSubmitRating,
  validatePaginationQueryForRatings
} = require('../validators/ratingValidators');
// Router for ratings related to a specific novel (will be mounted under /novels/:novelId/ratings)
const novelScopedRatingRouter = express.Router({ mergeParams: true });
// mergeParams: true allows access to :novelId from the parent route

// POST /api/v1/novels/:novelId/ratings - Submit or update a rating/review for this novel by the authenticated user
novelScopedRatingRouter.post('/',
  requireAuth,
  validateNovelIdParamForRatings,
  validateSubmitRating,
  ratingController.submitRating
);

// GET /api/v1/novels/:novelId/ratings - Get all ratings for this novel (public)
novelScopedRatingRouter.get('/',
  validateNovelIdParamForRatings,      // Validates :novelId
  validatePaginationQueryForRatings, // Validates query params for pagination
  ratingController.getNovelRatings
);

// GET /api/v1/novels/:novelId/ratings/me - Get the authenticated user's rating for this novel
novelScopedRatingRouter.get('/me',
  requireAuth,
  validateNovelIdParamForRatings, // Validates :novelId
  ratingController.getUserRatingForSpecificNovel
);

// DELETE /api/v1/novels/:novelId/ratings/me - Delete the authenticated user's rating for this novel
novelScopedRatingRouter.delete('/me',
  requireAuth,
  validateNovelIdParamForRatings, // Validates :novelId
  ratingController.deleteUserRating
);


module.exports = {
  novelScopedRatingRouter,
};