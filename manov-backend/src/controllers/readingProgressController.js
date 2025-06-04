// File: src/controllers/readingProgressController.js

const readingProgressService = require('../services/readingProgressService');

async function saveOrUpdateProgress(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForProgress
    const { novelId } = req.params;
    // req.body is validated by validateUpsertReadingProgress
    const { chapterId, readingPosition, progressPercentage } = req.body;

    const progressData = { chapterId, readingPosition, progressPercentage };
    const result = await readingProgressService.upsertReadingProgress(
      userId,
      novelId,
      progressData
    );
    res.status(200).json(result);
  } catch (error) {
    // Validator should catch input format errors.
    // Service errors (like Novel/Chapter not found) are handled here.
    if (
      error.message.includes('not found') ||
      error.message.includes('Invalid')
    ) {
      return res.status(400).json({ message: error.message }); // Or 404 if specifically "not found" for novel/chapter
    }
    next(error);
  }
}

async function getProgressForNovel(req, res, next) {
  try {
    const userId = req.user.id;
    // novelId is validated by validateNovelIdParamForProgress
    const { novelId } = req.params;

    const progress = await readingProgressService.getReadingProgress(
      userId,
      novelId
    );
    if (!progress && progress !== null) {
      // Service returns null if not found, which is valid
      // This path might not be hit if service throws for invalid ID only
      return res
        .status(404)
        .json({ message: 'Error fetching progress or novel ID invalid.' });
    }
    res.status(200).json(progress); // Send null if no progress found, or the progress object
  } catch (error) {
    // Service might throw 'Invalid Novel ID format'
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getAllProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;
    const pagination = {};
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
      pagination.skip = (pageNum - 1) * limitNum;
    } else if (!isNaN(limitNum) && limitNum > 0) {
      pagination.take = limitNum;
    }

    const data = await readingProgressService.getAllReadingProgressForUser(
      userId,
      pagination
    );
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

module.exports = {
  saveOrUpdateProgress,
  getProgressForNovel,
  getAllProgress,
};
