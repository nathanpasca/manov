// File: src/validators/userFavoriteValidators.js
const { param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for path parameter :novelId when used with favorite routes
const validateNovelIdParamForFavorite = [
  param('novelId')
    .isInt({ min: 1 }).withMessage('Novel ID in path must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

// Validator for pagination query parameters (can be reused or kept specific)
const validatePaginationQueryForFavorites = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 100}).withMessage('Limit must be a positive integer, max 100.')
        .toInt(),
    handleValidationErrors
];

module.exports = {
  validateNovelIdParamForFavorite,
  validatePaginationQueryForFavorites,
};