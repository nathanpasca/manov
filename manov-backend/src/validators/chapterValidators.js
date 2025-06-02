// File: src/validators/chapterValidators.js
const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateChapterCreation = [
  // novelId will be validated as a path parameter
  body('chapterNumber')
    .notEmpty().withMessage('Chapter number is required.')
    .isFloat({ min: 0 }).withMessage('Chapter number must be a non-negative number.') // Allow 0, 0.5, 1, 1.5 etc.
    .toFloat(),
  body('content')
    .trim()
    .notEmpty().withMessage('Chapter content is required.'),
    // .isLength({ min: 10 }).withMessage('Chapter content must be at least 10 characters.'), // Optional: enforce min length
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Chapter title must be at most 255 characters.'),
  body('wordCount')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Word count must be a non-negative integer.')
    .toInt(),
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean value.'),
  body('publishedAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Published at must be a valid ISO 8601 date (YYYY-MM-DD HH:MM:SS or YYYY-MM-DD).')
    .toDate(),
  body('translatorNotes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Translator notes must be at most 5000 characters.'),
  body('originalChapterUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Original chapter URL must be a valid URL.'),
  body('readingTimeEstimate')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Reading time estimate must be a non-negative integer.')
    .toInt(),
  handleValidationErrors,
];

const validateChapterUpdate = [
  // For updates, all fields are optional.
  body('chapterNumber')
    .optional()
    .isFloat({ min: 0 }).withMessage('Chapter number must be a non-negative number if provided.')
    .toFloat(),
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('Chapter content cannot be empty if provided.'),
    // .isLength({ min: 10 }).withMessage('Chapter content must be at least 10 characters if provided.'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Chapter title must be at most 255 characters.'),
  body('wordCount')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Word count must be a non-negative integer.')
    .toInt(),
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean value.'),
  body('publishedAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Published at must be a valid ISO 8601 date.')
    .toDate(),
  body('translatorNotes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Translator notes must be at most 5000 characters.'),
  body('originalChapterUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Original chapter URL must be a valid URL.'),
  body('readingTimeEstimate')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Reading time estimate must be a non-negative integer.')
    .toInt(),
  
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

// Validator for :novelId path parameter
const validateNovelIdParamForChapters = [
    param('novelId')
        .isInt({ min: 1 }).withMessage('Novel ID in path must be a positive integer.')
        .toInt(),
    handleValidationErrors,
];

// Validator for :chapterId path parameter
const validateChapterIdParam = [
    param('chapterId')
        .isInt({ min: 1 }).withMessage('Chapter ID in path must be a positive integer.')
        .toInt(),
    handleValidationErrors,
];

// Validator for :chapterNumber path parameter
const validateChapterNumberParam = [
    param('chapterNumber')
        .isFloat({ min: 0 }).withMessage('Chapter number in path must be a non-negative number.')
        .toFloat(),
    handleValidationErrors
];


module.exports = {
  validateChapterCreation,
  validateChapterUpdate,
  validateNovelIdParamForChapters,
  validateChapterIdParam,
  validateChapterNumberParam,
};