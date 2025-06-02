// File: src/validators/searchValidators.js
const { query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateSearchQuery = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query (q) is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters.'),
  query('type')
    .optional()
    .trim()
    .isIn(['novels', 'authors']).withMessage("Invalid search type. Allowed types are 'novels', 'authors'.")
    .default('novels'), // Default to searching novels if type is not provided or invalid (after isIn check)
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be a positive integer, max 50.')
    .toInt(),
  handleValidationErrors,
];

module.exports = {
  validateSearchQuery,
};