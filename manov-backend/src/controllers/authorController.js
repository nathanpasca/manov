// File: src/controllers/authorController.js

const authorService = require("../services/authorService");

async function createAuthor(req, res, next) {
  try {
    // More comprehensive validation will be added in Phase 8
    const { name, originalLanguage } = req.body;
    if (!name || !originalLanguage) {
      return res
        .status(400)
        .json({ message: "Author name and original language are required." });
    }

    // Pass the whole req.body to the service, which will pick the fields
    const newAuthor = await authorService.createAuthor(req.body);
    res.status(201).json(newAuthor);
  } catch (error) {
    // Example of more specific error handling based on service layer
    if (error.message.includes("required")) {
      return res.status(400).json({ message: error.message });
    }
    next(error); // Pass other errors to the centralized handler
  }
}

async function getAllAuthors(req, res, next) {
  try {
    // Basic pagination and filtering example (can be expanded)
    const { isActive, skip, take } = req.query;
    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }
    const pagination = { skip, take };

    const authors = await authorService.getAllAuthors(filters, pagination);
    res.status(200).json(authors);
  } catch (error) {
    next(error);
  }
}

async function getAuthorById(req, res, next) {
  try {
    const { authorId } = req.params;
    const author = await authorService.getAuthorById(authorId);
    if (!author) {
      return res.status(404).json({ message: "Author not found." });
    }
    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
}

async function updateAuthor(req, res, next) {
  try {
    const { authorId } = req.params;
    const authorData = req.body;

    if (Object.keys(authorData).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    const updatedAuthor = await authorService.updateAuthor(
      authorId,
      authorData,
    );
    res.status(200).json(updatedAuthor);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid author ID")
    ) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteAuthor(req, res, next) {
  try {
    const { authorId } = req.params;
    await authorService.deleteAuthor(authorId);
    res.status(204).send(); // No content
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid author ID")
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("associated with existing novels")) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
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
