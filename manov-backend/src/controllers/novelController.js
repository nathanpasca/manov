// File: src/controllers/novelController.js

const novelService = require('../services/novelService');

async function createNovel(req, res, next) {
  try {
    // Input data is already validated by validateNovelCreation middleware
    // Service layer will handle author existence check and slug generation
    const newNovel = await novelService.createNovel(req.body);
    res.status(201).json(newNovel);
  } catch (error) {
    // Validator should catch most input errors.
    // Service errors (like Author not found) are handled here.
    if (error.message.includes('Author with ID')) { // Example of specific service error
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getAllNovels(req, res, next) {
  try {
    const { isActive, publicationStatus, originalLanguage, genre, sortBy, sortOrder, page, limit } = req.query;
    // Basic validation/sanitization for query params can remain or be moved to a validator
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (publicationStatus) filters.publicationStatus = publicationStatus; // Assuming it's a valid enum value
    if (originalLanguage) filters.originalLanguage = originalLanguage;
    if (genre) filters.genreTags = { has: genre };

    const pagination = {};
    if (page && limit && !isNaN(parseInt(page,10)) && !isNaN(parseInt(limit,10))) {
      pagination.take = parseInt(limit, 10);
      pagination.skip = (parseInt(page, 10) - 1) * pagination.take;
    } else if (limit && !isNaN(parseInt(limit,10))) {
        pagination.take = parseInt(limit, 10);
    }

    const orderBy = {};
    if (sortBy && sortOrder && ['title', 'updatedAt', 'createdAt', 'viewCount', 'favoriteCount', 'averageRating'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const novels = await novelService.getAllNovels(filters, pagination, orderBy);
    res.status(200).json(novels);
  } catch (error) {
    next(error);
  }
}

async function getNovelByIdentifier(req, res, next) {
  try {
    // Identifier is validated by validateNovelIdentifierParam
    const { identifier } = req.params;
    const novel = await novelService.getNovelByIdentifier(identifier);
    if (!novel) {
      return res.status(404).json({ message: 'Novel not found.' });
    }
    res.status(200).json(novel);
  } catch (error) {
    next(error);
  }
}

async function updateNovel(req, res, next) {
  try {
    // novelId param and req.body are validated
    const { novelId } = req.params;
    const novelData = req.body;
    // The validator already checks if body is not empty for PUT (if `validateNovelUpdate` configured so).

    const updatedNovel = await novelService.updateNovel(novelId, novelData);
    res.status(200).json(updatedNovel);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Author with ID') || error.message.includes('Slug generated')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteNovel(req, res, next) {
  try {
    // novelId param is validated
    const { novelId } = req.params;
    await novelService.deleteNovel(novelId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  createNovel,
  getAllNovels,
  getNovelByIdentifier,
  updateNovel,
  deleteNovel,
};