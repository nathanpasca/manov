// File: src/validators/ratingValidators.js
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for path parameter :novelId when used with ratings routes
const validateNovelIdParamForRatings = [
  param('novelId')
    .isInt({ min: 1 }).withMessage('Novel ID in path must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

// Validator for the body of POST request to submit/update a rating
const validateSubmitRating = [
  body('rating')
    .notEmpty().withMessage('Rating value is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.')
    .toInt(),
  body('reviewText')
    .optional({ checkFalsy: true }) // Allows empty string, null, undefined
    .isString().withMessage('Review text must be a string.')
    .trim()
    .isLength({ max: 5000 }).withMessage('Review text must be at most 5000 characters.'),
  handleValidationErrors,
];

// Validator for pagination query parameters
const validatePaginationQueryForRatings = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 50}).withMessage('Limit must be a positive integer, max 50.') // Max limit for ratings list
        .toInt(),
    handleValidationErrors
];


module.exports = {
  validateNovelIdParamForRatings,
  validateSubmitRating,
  validatePaginationQueryForRatings,
};