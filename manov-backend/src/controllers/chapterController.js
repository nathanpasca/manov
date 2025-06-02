// File: src/controllers/chapterController.js

const chapterService = require('../services/chapterService');

async function createChapter(req, res, next) {
  try {
    // novelId is validated by validateNovelIdParamForChapters (from parent router)
    // req.body is validated by validateChapterCreation
    const { novelId } = req.params; 
    const chapterData = req.body;

    const newChapter = await chapterService.createChapter(novelId, chapterData);
    res.status(201).json(newChapter);
  } catch (error) {
    // Validator catches input errors. Service errors like "Novel not found" or "Chapter number already exists" are caught here.
    if (error.message.includes('not found')) { // e.g. Novel not found
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already exists')) { // e.g. Chapter number conflict
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

async function getChaptersByNovelId(req, res, next) {
  try {
    // novelId is validated by validateNovelIdParamForChapters
    const { novelId } = req.params;
    const { isPublished, page, limit, sortBy = 'chapterNumber', sortOrder = 'asc' } = req.query;

    // Basic query param processing (can be enhanced with express-validator's query())
    const filters = {};
    if (isPublished !== undefined) {
      filters.isPublished = isPublished === 'true';
    }

    const pagination = {};
    if (page && limit && !isNaN(parseInt(page,10)) && !isNaN(parseInt(limit,10))) {
      pagination.take = parseInt(limit, 10);
      pagination.skip = (parseInt(page, 10) - 1) * pagination.take;
    } else if (limit && !isNaN(parseInt(limit,10))) {
        pagination.take = parseInt(limit, 10);
    }
    
    const orderBy = {};
    if (sortBy && ['chapterNumber', 'publishedAt', 'title', 'wordCount', 'createdAt', 'updatedAt'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
        orderBy.chapterNumber = 'asc';
    }

    const chapters = await chapterService.getChaptersByNovelId(novelId, filters, pagination, orderBy);
    res.status(200).json(chapters);
  } catch (error) {
    // Service might throw 'Invalid novel ID format' if somehow bad ID passed (though validator should catch it)
    if (error.message.includes('Invalid novel ID')) {
        return res.status(400).json({message: error.message});
    }
    next(error);
  }
}

async function getChapterById(req, res, next) {
  try {
    // chapterId is validated by validateChapterIdParam
    const { chapterId } = req.params;
    const chapter = await chapterService.getChapterById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }
    res.status(200).json(chapter);
  } catch (error) {
    next(error);
  }
}

async function getChapterByNovelAndNumber(req, res, next) {
    try {
        // novelId and chapterNumber are validated by path param validators
        const { novelId, chapterNumber } = req.params;
        const chapter = await chapterService.getChapterByNovelAndNumber(novelId, chapterNumber);
        if (!chapter) {
            return res.status(404).json({ message: `Chapter number ${chapterNumber} not found for this novel.` });
        }
        res.status(200).json(chapter);
    } catch (error) {
        // Service might throw 'Invalid novel ID or chapter number format'
        if (error.message.includes('Invalid novel ID or chapter number')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
}

async function updateChapter(req, res, next) {
  try {
    // chapterId is validated by validateChapterIdParam
    // req.body is validated by validateChapterUpdate
    const { chapterId } = req.params;
    const chapterData = req.body;
    // Validator should have already checked if body is empty for PUT

    const updatedChapter = await chapterService.updateChapter(chapterId, chapterData);
    res.status(200).json(updatedChapter);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already exists')) { // Chapter number conflict on update
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteChapter(req, res, next) {
  try {
    // chapterId is validated by validateChapterIdParam
    const { chapterId } = req.params;
    await chapterService.deleteChapter(chapterId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  createChapter,
  getChaptersByNovelId,
  getChapterById,
  getChapterByNovelAndNumber,
  updateChapter,
  deleteChapter,
};