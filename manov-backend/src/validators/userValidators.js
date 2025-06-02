// File: src/validators/userValidators.js
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain alphanumeric characters and underscores.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(), // Sanitizer
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be between 8 and 100 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number. Special characters are allowed.'),
    // Example for password confirmation:
    // body('passwordConfirmation')
    //   .custom((value, { req }) => {
    //     if (value !== req.body.password) {
    //       throw new Error('Password confirmation does not match password');
    //     }
    //     return true;
    //   }),
  body('displayName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters.'),
  body('preferredLanguage')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 5 }).withMessage('Preferred language code should be 2-5 characters (e.g., en, pt-BR).'), // e.g. 'en', 'id'
  handleValidationErrors,
];

const validateUserProfileUpdate = [
  body('displayName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters if provided.'),
  body('avatarUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Avatar URL must be a valid URL if provided.'),
  body('preferredLanguage')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 5 }).withMessage('Preferred language code should be 2-5 characters if provided.'),
  body('readingPreferences')
    .optional()
    .isJSON().withMessage('Reading preferences must be a valid JSON object if provided.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Ensure at least one updatable field is present
    const updatableFields = ['displayName', 'avatarUrl', 'preferredLanguage', 'readingPreferences'];
    const providedFields = Object.keys(req.body).filter(key => updatableFields.includes(key));
    if (providedFields.length === 0) {
        return res.status(400).json({ message: 'No updatable profile data provided. Provide at least one of: displayName, avatarUrl, preferredLanguage, readingPreferences.' });
    }
    next();
  },
];

// New validator for Login
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

module.exports = {
  validateUserRegistration,
  validateUserProfileUpdate,
  validateUserLogin,
};