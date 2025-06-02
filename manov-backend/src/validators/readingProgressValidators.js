// File: src/validators/readingProgressValidators.js
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for path parameter :novelId when used with progress routes
const validateNovelIdParamForProgress = [
  param('novelId')
    .isInt({ min: 1 }).withMessage('Novel ID in path must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

// Validator for the body of PUT request to save/update progress
const validateUpsertReadingProgress = [
  body('chapterId')
    .notEmpty().withMessage('Chapter ID is required.')
    .isInt({ min: 1 }).withMessage('Chapter ID must be a positive integer.')
    .toInt(),
  body('readingPosition')
    .optional({ checkFalsy: true }) // Allows empty string, null, undefined
    .isString().withMessage('Reading position must be a string.')
    .isLength({ max: 255 }).withMessage('Reading position must be at most 255 characters.'),
  body('progressPercentage')
    .optional({ checkFalsy: true }) // Allows 0 to be a valid value
    .isInt({ min: 0, max: 100 }).withMessage('Progress percentage must be an integer between 0 and 100.')
    .toInt(),
  handleValidationErrors,
];

// Validator for pagination query parameters (can be reused)
const validatePaginationQuery = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 100}).withMessage('Limit must be a positive integer, max 100.') // Max limit to prevent abuse
        .toInt(),
    handleValidationErrors
];


module.exports = {
  validateNovelIdParamForProgress,
  validateUpsertReadingProgress,
  validatePaginationQuery,
};