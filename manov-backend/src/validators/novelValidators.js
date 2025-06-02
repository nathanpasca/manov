// File: src/validators/novelValidators.js
const { body, param, validationResult } = require('express-validator');
const { PublicationStatus, TranslationStatus } = require('@prisma/client'); // Import enums from Prisma Client

const allowedPublicationStatuses = Object.values(PublicationStatus);
const allowedTranslationStatuses = Object.values(TranslationStatus);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateNovelCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Novel title (original) is required.')
    .isLength({ min: 1, max: 255 }).withMessage('Novel title must be between 1 and 255 characters.'),
  body('authorId')
    .notEmpty().withMessage('Author ID is required.')
    .isInt({ min: 1 }).withMessage('Author ID must be a positive integer.')
    .toInt(),
  body('originalLanguage')
    .trim()
    .notEmpty().withMessage('Original language is required.')
    .isLength({ min: 2, max: 10 }).withMessage('Original language code must be between 2 and 10 characters.'),
  body('titleTranslated')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Translated title must be at most 255 characters.'),
  body('synopsis')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 10000 }).withMessage('Synopsis must be at most 10000 characters.'), // Adjust as needed
  body('coverImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Cover image URL must be a valid URL.'),
  body('sourceUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Source URL must be a valid URL.'),
  body('publicationStatus')
    .optional()
    .isIn(allowedPublicationStatuses).withMessage(`Invalid publication status. Allowed values: ${allowedPublicationStatuses.join(', ')}.`),
  body('translationStatus')
    .optional()
    .isIn(allowedTranslationStatuses).withMessage(`Invalid translation status. Allowed values: ${allowedTranslationStatuses.join(', ')}.`),
  body('genreTags')
    .optional()
    .isArray().withMessage('Genre tags must be an array.')
    .custom((tags) => { // Ensure each tag is a non-empty string and not too long
      if (!Array.isArray(tags)) return true; // Pass if not an array (isArray already checked)
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('Each genre tag must be a non-empty string.');
        }
        if (tag.length > 50) {
          throw new Error('Each genre tag must be at most 50 characters.');
        }
      }
      return true;
    }),
  body('totalChapters')
    .optional({ checkFalsy: true }) // Allows 0, null, empty string
    .isInt({ min: 0 }).withMessage('Total chapters must be a non-negative integer.')
    .toInt(),
  body('firstPublishedAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('First published at must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value.'),
  handleValidationErrors,
];

const validateNovelUpdate = [
  // For updates, all fields are optional.
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Novel title (original) cannot be empty if provided.')
    .isLength({ min: 1, max: 255 }).withMessage('Novel title must be between 1 and 255 characters.'),
  body('authorId')
    .optional()
    .isInt({ min: 1 }).withMessage('Author ID must be a positive integer if provided.')
    .toInt(),
  body('originalLanguage')
    .optional()
    .trim()
    .notEmpty().withMessage('Original language cannot be empty if provided.')
    .isLength({ min: 2, max: 10 }).withMessage('Original language code must be between 2 and 10 characters.'),
  body('titleTranslated')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Translated title must be at most 255 characters.'),
  body('synopsis')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 10000 }).withMessage('Synopsis must be at most 10000 characters.'),
  body('coverImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Cover image URL must be a valid URL.'),
  body('sourceUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Source URL must be a valid URL.'),
  body('publicationStatus')
    .optional()
    .isIn(allowedPublicationStatuses).withMessage(`Invalid publication status. Allowed values: ${allowedPublicationStatuses.join(', ')}.`),
  body('translationStatus')
    .optional()
    .isIn(allowedTranslationStatuses).withMessage(`Invalid translation status. Allowed values: ${allowedTranslationStatuses.join(', ')}.`),
  body('genreTags')
    .optional()
    .isArray().withMessage('Genre tags must be an array.')
    .custom((tags) => {
      if (!Array.isArray(tags)) return true;
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('Each genre tag must be a non-empty string.');
        }
        if (tag.length > 50) {
          throw new Error('Each genre tag must be at most 50 characters.');
        }
      }
      return true;
    }),
  body('totalChapters')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Total chapters must be a non-negative integer.')
    .toInt(),
  body('firstPublishedAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('First published at must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No data provided for update. At least one field must be present.' });
    }
    next();
  },
];

// Validator for route parameters like :novelId or :identifier (slug or ID)
const validateNovelIdentifierParam = [
    param('identifier') // For GET /:identifier (which could be slug or ID)
        .trim()
        .notEmpty().withMessage('Novel identifier (ID or slug) is required.'),
    // Further validation if it's an ID can be done in the service/controller
    // or by adding specific ID validation here if the route was only for ID.
    handleValidationErrors,
];

const validateNovelIdParam = [ // Specifically for numeric ID params like :novelId
    param('novelId')
        .isInt({ min: 1 }).withMessage('Novel ID must be a positive integer.')
        .toInt(),
    handleValidationErrors,
];

module.exports = {
  validateNovelCreation,
  validateNovelUpdate,
  validateNovelIdentifierParam,
  validateNovelIdParam,
};