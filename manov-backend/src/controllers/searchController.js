// File: src/controllers/searchController.js

const searchService = require('../services/searchService');

async function searchContent(req, res, next) {
  try {
    // Query parameters (q, type, page, limit) are validated by validateSearchQuery middleware
    const { q, type, page, limit } = req.query;

    const pagination = {};
    if (page && limit) {
      pagination.take = limit; // Already int from validator
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
      pagination.take = limit;
    }

    const searchResults = await searchService.performSearch(q, type, pagination);
    res.status(200).json(searchResults);
  } catch (error) {
    if (error.message.includes('Unsupported search type')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  searchContent,
};