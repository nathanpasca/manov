// File: src/validators/queryValidators.js
const { query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateLangQueryParam = [
  query('lang')
    .optional()
    .isString().withMessage('Language query parameter (lang) must be a string.')
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Language code must be between 2 and 10 characters (e.g., en, pt-BR).')
    // You could add .isIn(['en', 'id', 'zh']) if you have a fixed list of supported translated languages
    // but that might be better handled by checking against your Languages table in the service.
    , // Keep the comma if handleValidationErrors is separate, remove if it's the last in array.
  // No handleValidationErrors here, as this validator will be part of an array in the route.
  // The route will have its own final handleValidationErrors or this can be a standalone middleware array.
  // For simplicity let's assume it will be used like: router.get('/', [validateLangQueryParamArray], controller)
  // So, let's return the chain itself
];


// Re-exporting a pagination validator here for convenience if not already in a shared place
const validatePaginationQuery = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 100}).withMessage('Limit must be a positive integer, max 100.')
        .toInt(),
    // No handleValidationErrors here for individual validator chains that will be composed
];


module.exports = {
  validateLangQueryParam, // This is an array of validation checks
  validatePaginationQuery, // Also an array
  handleValidationErrors, // Exporting the handler to be used in route files
};