// File: src/validators/adminUserValidators.js
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for the :userId path parameter in admin routes
const validateUserIdParamForAdmin = [
  param('userId')
    .isString().withMessage('User ID must be a string (CUID).')
    .notEmpty().withMessage('User ID cannot be empty.')
    .isLength({ min: 20, max: 30 }).withMessage('User ID format is incorrect (expecting CUID length).'),
    // .isCUID().withMessage('User ID must be a valid CUID.'), // If you had a custom isCUID validator
  handleValidationErrors,
];

// Validator for the request body when an admin updates a user
const validateAdminUserUpdate = [
  body('displayName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters if provided.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address if provided.')
    .normalizeEmail(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value (true or false) if provided.'),
  body('isAdmin')
    .optional()
    .isBoolean().withMessage('isAdmin must be a boolean value (true or false) if provided.'),
  body('preferredLanguage')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 5 }).withMessage('Preferred language code should be 2-5 characters if provided.'),
  body('avatarUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Avatar URL must be a valid URL if provided.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // For PUT, ensure at least one field is being updated
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No data provided for update. At least one field must be present.' });
    }
    next();
  },
];

// Validator for query parameters when listing users as admin
const validateAdminListUsersQuery = [
    query('page')
        .optional()
        .isInt({min: 1}).withMessage('Page must be a positive integer.')
        .toInt(),
    query('limit')
        .optional()
        .isInt({min: 1, max: 100}).withMessage('Limit must be a positive integer, max 100.')
        .toInt(),
    query('isActive')
        .optional()
        .isBoolean().withMessage('isActive filter must be a boolean (true or false).')
        .toBoolean(), // Converts "true"/"false" strings to boolean
    query('isAdmin')
        .optional()
        .isBoolean().withMessage('isAdmin filter must be a boolean (true or false).')
        .toBoolean(),
    query('sortBy')
        .optional()
        .isIn(['username', 'email', 'createdAt', 'lastLoginAt', 'displayName'])
        .withMessage("Invalid sortBy field. Allowed: 'username', 'email', 'createdAt', 'lastLoginAt', 'displayName'."),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage("Sort order must be 'asc' or 'desc'."),
    handleValidationErrors
];


module.exports = {
  validateUserIdParamForAdmin,
  validateAdminUserUpdate,
  validateAdminListUsersQuery,
};