// File: src/validators/languageValidators.js
const { body, validationResult } = require('express-validator');

const validateLanguageCreation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Language code is required.')
    .isLength({ min: 2, max: 10 }).withMessage('Language code must be between 2 and 10 characters.')
    .isAlphanumeric().withMessage('Language code must be alphanumeric.'),
  body('name')
    .trim()
    .notEmpty().withMessage('Language name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Language name must be between 2 and 50 characters.'),
  body('nativeName')
    .optional({ checkFalsy: true }) // Allows empty string or null to pass, but if present, validates
    .trim()
    .isLength({ max: 50 }).withMessage('Native name must be at most 50 characters.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value (true or false).'),
  
  // Middleware to handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateLanguageUpdate = [
  // Similar rules as creation, but all fields are optional for PUT/PATCH
  // You might want to ensure at least one field is present for an update
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Language code must be between 2 and 10 characters.')
    .isAlphanumeric().withMessage('Language code must be alphanumeric.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Language name must be between 2 and 50 characters.'),
  body('nativeName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Native name must be at most 50 characters.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value (true or false).'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Check if at least one field is being updated
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No data provided for update. At least one field (code, name, nativeName, isActive) must be present.' });
    }
    next();
  },
];


module.exports = {
  validateLanguageCreation,
  validateLanguageUpdate,
};