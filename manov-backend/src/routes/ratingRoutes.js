// File: src/routes/ratingRoutes.js

const express = require('express');
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Router for ratings related to a specific novel (will be mounted under /novels/:novelId/ratings)
const novelScopedRatingRouter = express.Router({ mergeParams: true });
// mergeParams: true allows access to :novelId from the parent route

// POST /api/v1/novels/:novelId/ratings - Submit or update a rating/review for this novel by the authenticated user
novelScopedRatingRouter.post('/', requireAuth, ratingController.submitRating);

// GET /api/v1/novels/:novelId/ratings - Get all ratings for this novel (public)
novelScopedRatingRouter.get('/', ratingController.getNovelRatings);

// GET /api/v1/novels/:novelId/ratings/me - Get the authenticated user's rating for this novel
novelScopedRatingRouter.get('/me', requireAuth, ratingController.getUserRatingForSpecificNovel);

// DELETE /api/v1/novels/:novelId/ratings/me - Delete the authenticated user's rating for this novel
novelScopedRatingRouter.delete('/me', requireAuth, ratingController.deleteUserRating);


module.exports = {
  novelScopedRatingRouter,
};