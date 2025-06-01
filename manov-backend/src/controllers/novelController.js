// File: src/controllers/novelController.js

const novelService = require("../services/novelService");

async function createNovel(req, res, next) {
  try {
    // Basic validation for essential fields
    const { title, authorId, originalLanguage } = req.body;
    if (!title || !authorId || !originalLanguage) {
      return res.status(400).json({
        message: "Title, authorId, and originalLanguage are required.",
      });
    }
    // More specific validation (e.g. authorId is number) can be added
    if (isNaN(parseInt(authorId, 10))) {
      return res.status(400).json({ message: "Author ID must be a number." });
    }

    const newNovel = await novelService.createNovel(req.body);
    res.status(201).json(newNovel);
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("Author with ID")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getAllNovels(req, res, next) {
  try {
    // Extract filter, pagination, and sort options from query parameters
    const {
      isActive,
      publicationStatus,
      originalLanguage,
      genre,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (publicationStatus) filters.publicationStatus = publicationStatus;
    if (originalLanguage) filters.originalLanguage = originalLanguage;
    if (genre) filters.genreTags = { has: genre }; // Example for array contains

    const pagination = {};
    if (page && limit) {
      pagination.take = parseInt(limit, 10);
      pagination.skip = (parseInt(page, 10) - 1) * pagination.take;
    } else if (limit) {
      pagination.take = parseInt(limit, 10);
    }

    const orderBy = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy] = sortOrder.toLowerCase(); // e.g. { "viewCount": "desc" }
    } else {
      orderBy.updatedAt = "desc"; // Default sort
    }

    const novels = await novelService.getAllNovels(
      filters,
      pagination,
      orderBy,
    );
    // Could also fetch total count for pagination headers if needed
    res.status(200).json(novels);
  } catch (error) {
    next(error);
  }
}

async function getNovelByIdentifier(req, res, next) {
  try {
    const { identifier } = req.params; // This can be an ID or a slug
    const novel = await novelService.getNovelByIdentifier(identifier);
    if (!novel) {
      return res.status(404).json({ message: "Novel not found." });
    }
    res.status(200).json(novel);
  } catch (error) {
    next(error);
  }
}

async function updateNovel(req, res, next) {
  try {
    const { novelId } = req.params;
    const novelData = req.body;

    if (Object.keys(novelData).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    const updatedNovel = await novelService.updateNovel(novelId, novelData);
    res.status(200).json(updatedNovel);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid novel ID")
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Author with ID")) {
      // From service check
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Slug generated")) {
      // From slug conflict during update
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteNovel(req, res, next) {
  try {
    const { novelId } = req.params;
    await novelService.deleteNovel(novelId);
    res.status(204).send();
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid novel ID")
    ) {
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
