// File: src/controllers/userFavoriteController.js

const userFavoriteService = require('../services/userFavoriteService');

async function addNovelToFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForFavorite
    const { novelId } = req.params;

    const favorite = await userFavoriteService.addFavorite(userId, novelId);
    res.status(201).json(favorite);
  } catch (error) {
    // Service errors like "Novel not found" or "already in favorites"
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already in your favorites')) {
      return res.status(409).json({ message: error.message });
    }
    // Validator catches invalid Novel ID format before it hits the service if param is not int
    if (error.message.includes('Invalid Novel ID format')) { // From service, defensive
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function removeNovelFromFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForFavorite
    const { novelId } = req.params;

    await userFavoriteService.removeFavorite(userId, novelId);
    res.status(204).send();
  } catch (error) {
    // Service errors like "not found in your favorites"
    if (error.message.includes('not found in your favorites') || error.message.includes('Invalid Novel ID')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

async function listUserFavorites(req, res, next) {
  try {
    const userId = req.user.id;
    // page and limit are validated by validatePaginationQueryForFavorites
    const { page, limit } = req.query;
    const pagination = {};

    if (page && limit) {
      pagination.take = limit; // Already an int from validator
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit;
    }

    const favorites = await userFavoriteService.getAllFavoritesForUser(userId, pagination);
    res.status(200).json(favorites);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addNovelToFavorites,
  removeNovelFromFavorites,
  listUserFavorites,
};