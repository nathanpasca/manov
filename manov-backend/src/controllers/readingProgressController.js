// File: src/controllers/readingProgressController.js

const readingProgressService = require('../services/readingProgressService');

async function saveOrUpdateProgress(req, res, next) {
  try {
    const userId = req.user.id; // Assumes requireAuth middleware populates req.user
    const { novelId } = req.params;
    const { chapterId, readingPosition, progressPercentage } = req.body;

    if (!chapterId) { // chapterId is essential
        return res.status(400).json({ message: 'chapterId is required in the request body.' });
    }

    const progressData = { chapterId, readingPosition, progressPercentage };
    const result = await readingProgressService.upsertReadingProgress(userId, novelId, progressData);
    res.status(200).json(result); // 200 OK for upsert (could be 201 if always new)
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('not found')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getProgressForNovel(req, res, next) {
  try {
    const userId = req.user.id;
    const { novelId } = req.params;

    const progress = await readingProgressService.getReadingProgress(userId, novelId);
    if (!progress) {
      // It's not necessarily an error if no progress exists, could mean user hasn't started
      return res.status(200).json(null); // Or 404 if you prefer to indicate no resource
    }
    res.status(200).json(progress);
  } catch (error) {
     if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getAllProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const allProgress = await readingProgressService.getAllReadingProgressForUser(userId);
    res.status(200).json(allProgress);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  saveOrUpdateProgress,
  getProgressForNovel,
  getAllProgress,
};