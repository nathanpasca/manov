// File: src/controllers/ratingController.js

const ratingService = require('../services/ratingService');

async function submitRating(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params;
    const { rating, reviewText } = req.body;

    if (rating === undefined) {
      return res.status(400).json({ message: 'Rating value is required.' });
    }

    const ratingData = { rating: parseInt(rating, 10), reviewText };
    const result = await ratingService.upsertRating(userId, novelId, ratingData);
    res.status(200).json(result); // 200 OK for upsert (could be 201 if always new)
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('not found') || error.message.includes('must be a number')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getNovelRatings(req, res, next) {
  try {
    const { novelId } = req.params;
    const { page, limit } = req.query;
    const pagination = {};

    if (page && limit) {
      pagination.take = parseInt(limit, 10);
      pagination.skip = (parseInt(page, 10) - 1) * pagination.take;
    } else if (limit) {
        pagination.take = parseInt(limit, 10);
    }

    const ratings = await ratingService.getRatingsForNovel(novelId, pagination);
    // Consider fetching total count for pagination headers
    res.status(200).json(ratings);
  } catch (error) {
    if (error.message.includes('Invalid Novel ID')) {
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function getUserRatingForSpecificNovel(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params;

    const rating = await ratingService.getUserRatingForNovel(userId, novelId);
    if (!rating) {
      // Not an error if user hasn't rated it yet
      return res.status(200).json(null); // Or 404 if you prefer
    }
    res.status(200).json(rating);
  } catch (error) {
    if (error.message.includes('Invalid Novel ID')) {
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function deleteUserRating(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params; // The novel whose rating by this user is to be deleted

    await ratingService.deleteRating(userId, novelId);
    res.status(204).send(); // No content, successful deletion
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Invalid Novel ID')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  submitRating,
  getNovelRatings,
  getUserRatingForSpecificNovel,
  deleteUserRating,
};