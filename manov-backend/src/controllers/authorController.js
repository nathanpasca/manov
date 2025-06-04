// File: src/controllers/authorController.js

const authorService = require('../services/authorService');

async function createAuthor(req, res, next) {
  try {
    // Input data is already validated by validateAuthorCreation middleware
    // req.body will also have dates converted to Date objects if valid ISO strings were provided
    const newAuthor = await authorService.createAuthor(req.body);
    res.status(201).json(newAuthor);
  } catch (error) {
    // The validator should catch most input errors.
    // This catch is for service layer errors (e.g., database issues).
    next(error);
  }
}

async function getAllAuthors(req, res, next) {
  try {
    const { isActive, page, limit } = req.query; // Use page, limit consistently
    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const pagination = {};
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
      pagination.skip = (pageNum - 1) * limitNum;
    } else if (!isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
    }

    const data = await authorService.getAllAuthors(filters, pagination);
    res.status(200).json({
      results: data.results,
      totalCount: data.totalCount,
      page: pageNum || 1,
      limit: limitNum || data.results.length,
      totalPages: limitNum ? Math.ceil(data.totalCount / limitNum) : 1,
    });
  } catch (error) {
    next(error);
  }
}

async function getAuthorById(req, res, next) {
  try {
    // authorId is validated and converted to int by validateAuthorIdParam
    const { authorId } = req.params;
    const author = await authorService.getAuthorById(authorId); // Service expects integer
    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }
    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
}

async function updateAuthor(req, res, next) {
  try {
    // authorId is validated by validateAuthorIdParam
    // req.body is validated by validateAuthorUpdate
    const { authorId } = req.params;
    const authorData = req.body;
    // The validator already checks if body is not empty for PUT if configured that way.
    // Or we can add the check here if not done in validator for PUT specifically.
    // if (req.method === 'PUT' && Object.keys(authorData).length === 0) {
    //   return res.status(400).json({ message: 'No data provided for update.' });
    // }

    const updatedAuthor = await authorService.updateAuthor(
      authorId,
      authorData
    );
    res.status(200).json(updatedAuthor);
  } catch (error) {
    if (error.message.includes('not found')) {
      // From service layer
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteAuthor(req, res, next) {
  try {
    // authorId is validated by validateAuthorIdParam
    const { authorId } = req.params;
    await authorService.deleteAuthor(authorId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('associated with existing novels')) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
};
