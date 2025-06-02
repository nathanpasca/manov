// File: src/routes/commentRoutes.js

const express = require('express');
const commentController = require('../controllers/commentController');
const { requireAuth } // No requireAdmin directly here, controller/service handles admin logic for delete
    = require('../middlewares/authMiddleware');
const {
    validateNovelIdParamForComment,
    validateChapterIdParamForComment,
    validateCommentIdParam, // Used for parentId in replies and target commentId for update/delete
    validateCommentBody,
    validatePaginationQueryForComments,
} = require('../validators/commentValidators');

// Router for comments scoped under a specific novel
// To be mounted at /api/v1/novels/:novelId/comments
const novelScopedCommentRouter = express.Router({ mergeParams: true }); // mergeParams to get :novelId

// POST /api/v1/novels/:novelId/comments - Create a new top-level comment for a novel
novelScopedCommentRouter.post('/',
    requireAuth,
    validateNovelIdParamForComment, // Ensures :novelId is valid from the parent route
    validateCommentBody,
    commentController.createNovelComment
);

// GET /api/v1/novels/:novelId/comments - Get all comments for a novel
novelScopedCommentRouter.get('/',
    validateNovelIdParamForComment, // Ensures :novelId is valid
    validatePaginationQueryForComments,
    commentController.getNovelComments
);

// Router for comments scoped under a specific chapter
// To be mounted at /api/v1/chapters/:chapterId/comments
const chapterScopedCommentRouter = express.Router({ mergeParams: true }); // mergeParams to get :chapterId

// POST /api/v1/chapters/:chapterId/comments - Create a new top-level comment for a chapter
chapterScopedCommentRouter.post('/',
    requireAuth,
    validateChapterIdParamForComment, // Ensures :chapterId is valid from the parent route
    validateCommentBody,
    commentController.createChapterComment
);

// GET /api/v1/chapters/:chapterId/comments - Get all comments for a chapter
chapterScopedCommentRouter.get('/',
    validateChapterIdParamForComment, // Ensures :chapterId is valid
    validatePaginationQueryForComments,
    commentController.getChapterComments
);


// Router for direct actions on comments (update, delete) and replies
// To be mounted at /api/v1/comments
const commentActionRouter = express.Router();

// POST /api/v1/comments/:commentId/replies - Reply to a specific comment
commentActionRouter.post('/:commentId/replies', // :commentId here is the parentCommentId
    requireAuth,
    validateCommentIdParam, // Validates the parent :commentId in the path
    validateCommentBody,    // Validates the content of the reply
    commentController.createReplyComment
);

// PUT /api/v1/comments/:commentId - Update a specific comment
commentActionRouter.put('/:commentId',
    requireAuth,
    validateCommentIdParam, // Validates the target :commentId
    validateCommentBody,
    commentController.updateComment
);

// DELETE /api/v1/comments/:commentId - Delete a specific comment
commentActionRouter.delete('/:commentId',
    requireAuth,
    validateCommentIdParam, // Validates the target :commentId
    commentController.deleteComment
);


module.exports = {
    novelScopedCommentRouter,
    chapterScopedCommentRouter,
    commentActionRouter,
};