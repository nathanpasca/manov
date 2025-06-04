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
    if (error.message.includes('not found')) {
      // e.g. Novel not found
      return res.status(400).json({ message: error.message }); // Changed to 400 as it's often due to bad input novelId
    }
    if (error.message.includes('already exists')) {
      // e.g. Chapter number conflict
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('required')) {
      // From service layer if validator somehow bypassed
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getChaptersByNovelId(req, res, next) {
  try {
    // novelId is validated by validateNovelIdParamForChapters
    const { novelId } = req.params;
    // lang, page, limit, isPublished, sortBy, sortOrder are validated or processed from req.query
    const {
      isPublished,
      page,
      limit,
      sortBy = 'chapterNumber',
      sortOrder = 'asc',
      lang,
    } = req.query;

    const filters = {};
    if (isPublished !== undefined) {
      // Convert string "true" or "false" to boolean
      filters.isPublished = isPublished === 'true'; // <--- MODIFICATION HERE
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

    const orderBy = {};
    // sortBy and sortOrder are validated by isIn by the query validator (if you add it there)
    // For now, controller checks against a whitelist for safety.
    if (
      sortBy &&
      [
        'chapterNumber',
        'publishedAt',
        'title',
        'wordCount',
        'createdAt',
        'updatedAt',
      ].includes(sortBy)
    ) {
      orderBy[sortBy] =
        sortOrder && sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.chapterNumber = 'asc'; // Default sort
    }

    const data = await chapterService.getChaptersByNovelId(
      novelId,
      filters,
      pagination,
      orderBy,
      lang
    );
    res.status(200).json({
      results: data.results,
      totalCount: data.totalCount,
      page: pageNum || 1,
      limit: limitNum || data.results.length,
      totalPages: limitNum ? Math.ceil(data.totalCount / limitNum) : 1,
    });
  } catch (error) {
    if (error.message.includes('Invalid novel ID')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getChapterById(req, res, next) {
  try {
    // chapterId is validated by validateChapterIdParam
    const { chapterId } = req.params;
    // lang is validated by validateLangQueryParam
    const { lang } = req.query;

    // Pass lang to the service
    const chapter = await chapterService.getChapterById(chapterId, lang);
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
    // lang is validated by validateLangQueryParam
    const { lang } = req.query;

    // Pass lang to the service
    const chapter = await chapterService.getChapterByNovelAndNumber(
      novelId,
      chapterNumber,
      lang
    );
    if (!chapter) {
      return res.status(404).json({
        message: `Chapter number ${chapterNumber} not found for this novel.`,
      });
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

    const updatedChapter = await chapterService.updateChapter(
      chapterId,
      chapterData
    );
    res.status(200).json(updatedChapter);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already exists')) {
      // Chapter number conflict on update
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
