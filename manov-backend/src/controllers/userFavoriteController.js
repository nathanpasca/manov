// File: src/controllers/userFavoriteController.js

const userFavoriteService = require('../services/userFavoriteService');

async function addNovelToFavorites(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params;

    const favorite = await userFavoriteService.addFavorite(userId, novelId);
    res.status(201).json(favorite); // 201 Created
  } catch (error) {
    if (error.message.includes('Invalid Novel ID') || error.message.includes('not found')) {
      return res.status(404).json({ message: error.message }); // Or 400 for invalid ID format
    }
    if (error.message.includes('already in your favorites')) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    next(error);
  }
}

async function removeNovelFromFavorites(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params;

    await userFavoriteService.removeFavorite(userId, novelId);
    res.status(204).send(); // No content, successful deletion
  } catch (error) {
    if (error.message.includes('Invalid Novel ID') || error.message.includes('not found in your favorites')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

async function listUserFavorites(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { page, limit } = req.query;
    const pagination = {};

    if (page && limit) {
      pagination.take = parseInt(limit, 10);
      pagination.skip = (parseInt(page, 10) - 1) * pagination.take;
    } else if (limit) {
        pagination.take = parseInt(limit, 10);
    }


    const favorites = await userFavoriteService.getAllFavoritesForUser(userId, pagination);
    // Consider adding total count for pagination headers if doing frontend pagination
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