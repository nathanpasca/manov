// File: src/routes/userFavoriteRoutes.js

const express = require('express');
const userFavoriteController = require('../controllers/userFavoriteController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Router for favoriting/unfavoriting specific novels (will be mounted under /novels/:novelId/favorite)
const novelFavoriteRouter = express.Router({ mergeParams: true });
// mergeParams: true allows access to :novelId from the parent route

// POST /api/v1/novels/:novelId/favorite - Add novel to current user's favorites
novelFavoriteRouter.post('/', requireAuth, userFavoriteController.addNovelToFavorites);

// DELETE /api/v1/novels/:novelId/favorite - Remove novel from current user's favorites
novelFavoriteRouter.delete('/', requireAuth, userFavoriteController.removeNovelFromFavorites);


// Router for listing all favorites for the current user
const userScopedFavoritesRouter = express.Router();

// GET /api/v1/users/me/favorites - List all novels favorited by the current user
userScopedFavoritesRouter.get('/', requireAuth, userFavoriteController.listUserFavorites);


module.exports = {
  novelFavoriteRouter,      // To be mounted under /novels/:novelId/favorite
  userScopedFavoritesRouter // To be mounted under /users/me/favorites
};