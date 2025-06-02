// File: src/validators/authorValidators.js
const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateAuthorCreation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Author name is required.')
    .isLength({ min: 1, max: 255 }).withMessage('Author name must be between 1 and 255 characters.'),
  body('originalLanguage')
    .trim()
    .notEmpty().withMessage('Original language is required.')
    .isLength({ min: 2, max: 10 }).withMessage('Original language code must be between 2 and 10 characters.'), // e.g., 'en', 'zh-CN'
  body('nameRomanized')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Romanized name must be at most 255 characters.'),
  body('biography')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Biography must be at most 5000 characters.'), // Adjust max length as needed
  body('birthDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Birth date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(), // Converts to JavaScript Date object
  body('deathDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Death date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate()
    .custom((value, { req }) => { // Custom validation: deathDate must be after birthDate
      if (req.body.birthDate && value && new Date(value) < new Date(req.body.birthDate)) {
        throw new Error('Death date must be after birth date.');
      }
      return true;
    }),
  body('nationality')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Nationality must be at most 100 characters.'),
  body('profileImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Profile image URL must be a valid URL.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value (true or false).'),
  handleValidationErrors,
];

const validateAuthorUpdate = [
  // For updates, all fields are optional.
  // We'll add a check in the controller or a custom validator to ensure at least one field is present if needed.
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Author name cannot be empty if provided.')
    .isLength({ min: 1, max: 255 }).withMessage('Author name must be between 1 and 255 characters.'),
  body('originalLanguage')
    .optional()
    .trim()
    .notEmpty().withMessage('Original language cannot be empty if provided.')
    .isLength({ min: 2, max: 10 }).withMessage('Original language code must be between 2 and 10 characters.'),
  body('nameRomanized')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Romanized name must be at most 255 characters.'),
  body('biography')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Biography must be at most 5000 characters.'),
  body('birthDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Birth date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),
  body('deathDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Death date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate()
    .custom((value, { req }) => {
      const birthDateToCompare = req.body.birthDate || (req.persistedAuthor && req.persistedAuthor.birthDate);
      if (birthDateToCompare && value && new Date(value) < new Date(birthDateToCompare)) {
        throw new Error('Death date must be after birth date.');
      }
      return true;
    }),
  body('nationality')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Nationality must be at most 100 characters.'),
  body('profileImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Profile image URL must be a valid URL.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value (true or false).'),
  
  // Middleware to handle validation results and check if body is empty
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Ensure at least one field is being updated if it's a PUT/PATCH
    // This check is better placed in the controller or a more specific middleware if needed,
    // as this validator might be used for PATCH where partial updates are expected.
    // For now, we assume if the body passes validation and is not empty, it's fine.
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No data provided for update. At least one field must be present.' });
    }
    next();
  },
];

// Validator for route parameters like :authorId
const validateAuthorIdParam = [
    param('authorId')
        .isInt({ min: 1 }).withMessage('Author ID must be a positive integer.')
        .toInt(), // Convert to integer
    handleValidationErrors,
];


module.exports = {
  validateAuthorCreation,
  validateAuthorUpdate,
  validateAuthorIdParam,
};