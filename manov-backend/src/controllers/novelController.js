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
    // lang, page, limit, etc. are validated by middleware in routes
    const { 
        isActive, 
        publicationStatus, 
        originalLanguage,  // This filters by the Novel.originalLanguage field
        genre, 
        sortBy, 
        sortOrder, 
        page, 
        limit, 
        lang // The desired language for translated content
    } = req.query;
    
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive; // Already boolean due to validator or needs 'true'/'false' string check
    if (publicationStatus) filters.publicationStatus = publicationStatus;
    if (originalLanguage) filters.originalLanguage = originalLanguage;
    if (genre) filters.genreTags = { has: genre };

    const pagination = {};
    if (page && limit) { 
      pagination.take = limit; // Already int from validator
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit; // Already int from validator
    }

    const orderBy = {};
    if (sortBy && sortOrder && ['title', 'updatedAt', 'createdAt', 'viewCount', 'favoriteCount', 'averageRating'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.updatedAt = 'desc'; // Default sort
    }

    // Pass the 'lang' query parameter to the service function
    const novels = await novelService.getAllNovels(filters, pagination, orderBy, lang);
    res.status(200).json(novels);
  } catch (error) {
    next(error);
  }
}

async function getNovelByIdentifier(req, res, next) {
  try {
    // identifier is validated by validateNovelIdentifierParam
    const { identifier } = req.params;
    // lang is validated by validateLangQueryParam
    const { lang } = req.query; 

    // Pass the 'lang' query parameter to the service function
    const novel = await novelService.getNovelByIdentifier(identifier, lang);
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