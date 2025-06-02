// File: src/controllers/commentController.js

const commentService = require('../services/commentService');

// --- Create Operations ---

async function createNovelComment(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth middleware
    const { novelId } = req.params; // Validated by middleware
    const { content } = req.body; // Validated by middleware

    const commentData = { content, novelId: parseInt(novelId, 10) };
    const newComment = await commentService.createComment(userId, commentData);
    res.status(201).json(newComment);
  } catch (error) {
    // Service layer errors (e.g., Novel not found, content required if validator missed it)
    if (error.message.includes('not found') || error.message.includes('required') || error.message.includes('must be associated')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function createChapterComment(req, res, next) {
  try {
    const userId = req.user.id;
    const { chapterId } = req.params; // Validated by middleware
    const { content } = req.body; // Validated by middleware

    const commentData = { content, chapterId: parseInt(chapterId, 10) };
    const newComment = await commentService.createComment(userId, commentData);
    res.status(201).json(newComment);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('required') || error.message.includes('must be associated')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function createReplyComment(req, res, next) {
  try {
    const userId = req.user.id;
    const { commentId: parentId } = req.params; // Renaming for clarity, validated by middleware
    const { content } = req.body; // Validated by middleware

    const commentData = { content, parentId };
    const newComment = await commentService.createComment(userId, commentData);
    res.status(201).json(newComment);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('required')) { // e.g. Parent comment not found
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// --- Read Operations ---

async function getNovelComments(req, res, next) {
  try {
    const { novelId } = req.params; // Validated by middleware
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query; // Validated by middleware

    const pagination = {};
    if (page && limit) {
      pagination.take = limit;
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit;
    }

    const orderBy = {};
    if (sortBy && ['createdAt', 'updatedAt'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
        orderBy.createdAt = 'desc'; // Default sort
    }

    const comments = await commentService.getCommentsForNovel(novelId, pagination, orderBy);
    // Optionally, get total count for pagination headers
    res.status(200).json(comments);
  } catch (error) {
    if (error.message.includes('Invalid Novel ID')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function getChapterComments(req, res, next) {
  try {
    const { chapterId } = req.params; // Validated
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query; // Validated

    const pagination = {};
    if (page && limit) {
      pagination.take = limit;
      pagination.skip = (page - 1) * limit;
    } else if (limit) {
        pagination.take = limit;
    }
    
    const orderBy = {};
    if (sortBy && ['createdAt', 'updatedAt'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
        orderBy.createdAt = 'desc'; // Default sort
    }

    const comments = await commentService.getCommentsForChapter(chapterId, pagination, orderBy);
    res.status(200).json(comments);
  } catch (error) {
    if (error.message.includes('Invalid Chapter ID')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// --- Update Operation ---

async function updateComment(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth
    const { commentId } = req.params; // Validated
    const { content } = req.body; // Validated

    // The service now handles ownership check based on userId passed.
    // No need to fetch comment here first if service does the check.
    const updatedComment = await commentService.updateComment(commentId, userId, { content });
    res.status(200).json(updatedComment);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('cannot be empty')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// --- Delete Operation ---

async function deleteComment(req, res, next) {
  try {
    const userId = req.user.id; // From requireAuth
    const isAdmin = req.user.isAdmin || false;
    const { commentId } = req.params; // Validated

    // Service handles ownership/admin check
    await commentService.deleteComment(commentId, userId, isAdmin);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
}

module.exports = {
  createNovelComment,
  createChapterComment,
  createReplyComment,
  getNovelComments,
  getChapterComments,
  updateComment,
  deleteComment,
};