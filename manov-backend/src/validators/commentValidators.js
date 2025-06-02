// File: src/validators/commentValidators.js
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateNovelIdParamForComment = [
  param('novelId')
    .isInt({ min: 1 }).withMessage('Novel ID in path must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const validateChapterIdParamForComment = [
  param('chapterId')
    .isInt({ min: 1 }).withMessage('Chapter ID in path must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

// For :commentId when it's a parent for replies, or the target for update/delete
const validateCommentIdParam = [
  param('commentId')
    .isString().withMessage('Comment ID must be a string (CUID).')
    .notEmpty().withMessage('Comment ID cannot be empty.')
    .isLength({ min: 20, max: 30 }).withMessage('Comment ID format is incorrect.'), // Basic CUID length check
    // .isCUID().withMessage('Comment ID must be a valid CUID.'), // express-validator doesn't have isCUID directly. Use matches or custom.
    // For simplicity, we'll rely on string format and length for now.
  handleValidationErrors,
];

const validateCommentBody = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content cannot be empty.')
    .isLength({ min: 1, max: 5000 }).withMessage('Comment content must be between 1 and 5000 characters.'),
  handleValidationErrors,
];

// Validator for pagination query parameters
const validatePaginationQueryForComments = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 50}).withMessage('Limit must be a positive integer, max 50 comments per page.')
        .toInt(),
    // Example for sorting comments
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt']).withMessage("Can only sort by 'createdAt' or 'updatedAt'."),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage("Sort order must be 'asc' or 'desc'."),
    handleValidationErrors
];


module.exports = {
  validateNovelIdParamForComment,
  validateChapterIdParamForComment,
  validateCommentIdParam,
  validateCommentBody,
  validatePaginationQueryForComments,
};