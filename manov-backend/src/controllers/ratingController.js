// File: src/controllers/ratingController.js

const ratingService = require('../services/ratingService');

async function submitRating(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForRatings
    const { novelId } = req.params;
    // req.body (rating, reviewText) is validated by validateSubmitRating
    const { rating, reviewText } = req.body;

    const ratingData = { rating, reviewText }; // Validators ensure rating is int
    const result = await ratingService.upsertRating(userId, novelId, ratingData);
    res.status(200).json(result);
  } catch (error) {
    // Validator should catch input format errors.
    // Service errors (like Novel not found) are handled here.
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message }); // Or 404 if specifically novel not found
    }
    next(error);
  }
}

async function getNovelRatings(req, res, next) {
  try {
    // novelId is validated by validateNovelIdParamForRatings
    const { novelId } = req.params;
    // page and limit are validated by validatePaginationQueryForRatings
    const { page, limit } = req.query;
    const pagination = {};

    if (page && limit) {
      pagination.take = limit; // Already an int from validator
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit;
    }

    const ratings = await ratingService.getRatingsForNovel(novelId, pagination);
    res.status(200).json(ratings);
  } catch (error) {
    // Service might throw 'Invalid Novel ID format'
    if (error.message.includes('Invalid Novel ID')) {
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function getUserRatingForSpecificNovel(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForRatings
    const { novelId } = req.params;

    const rating = await ratingService.getUserRatingForNovel(userId, novelId);
    if (!rating && rating !== null) { // Service returns null if not found, which is valid
        // This path might not be hit if service throws for invalid ID only
        return res.status(404).json({ message: 'Error fetching rating or novel ID invalid.' });
    }
    res.status(200).json(rating); // Send null if no rating found, or the rating object
  } catch (error) {
    // Service might throw 'Invalid Novel ID format'
     if (error.message.includes('Invalid Novel ID')) {
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function deleteUserRating(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForRatings
    const { novelId } = req.params;

    await ratingService.deleteRating(userId, novelId);
    res.status(204).send();
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