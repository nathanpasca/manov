// File: src/validators/translationValidators.js
const { body, param, validationResult } = require('express-validator');
const prisma = require('../lib/prisma'); // Ensure this path is correct

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for ':languageCode' path parameter
const validateLanguageCodeParam = [
  param('languageCode')
    .trim()
    .notEmpty()
    .withMessage('Language code path parameter is required.')
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters.')
    .custom(async (value) => {
      const language = await prisma.language.findUnique({
        where: { code: value },
      });
      if (!language || !language.isActive) {
        throw new Error(`Language code '${value}' is not valid or not active.`);
      }
      return true;
    }),
  // handleValidationErrors // Typically called after all validators in the route
];

// Validator for ':novelId' path parameter
const validateNovelIdParam = [
  param('novelId')
    .isInt({ min: 1 })
    .withMessage('Novel ID path parameter must be a positive integer.')
    .toInt(),
  // handleValidationErrors
];

// Validator for ':chapterId' path parameter
const validateChapterIdParam = [
  param('chapterId')
    .isInt({ min: 1 })
    .withMessage('Chapter ID path parameter must be a positive integer.')
    .toInt(),
  // handleValidationErrors
];

// Validator for the request body of Novel Translations (POST and PUT)
const validateNovelTranslationBody = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Translated title is required.')
    .isLength({ min: 1, max: 255 })
    .withMessage('Translated title must be between 1 and 255 characters.'),
  body('synopsis')
    .optional({ checkFalsy: true }) // Allows empty string, null, undefined
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Translated synopsis must be at most 10000 characters.'),
  body('languageCode') // Required for POST if languageCode is not in URL params
    .if((value, { req }) => req.method === 'POST' && !req.params.languageCode) // Apply only if languageCode is in body for POST
    .trim()
    .notEmpty()
    .withMessage(
      'Language code in body is required for adding new translation.'
    )
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters.')
    .custom(async (value) => {
      const language = await prisma.language.findUnique({
        where: { code: value },
      });
      if (!language || !language.isActive) {
        throw new Error(`Language code '${value}' is not valid or not active.`);
      }
      return true;
    }),
  body('translatorId')
    .optional({ checkFalsy: true }) // translatorId is optional
    .isString()
    .withMessage('Translator ID must be a string (CUID).')
    .isLength({ min: 20, max: 30 }) // Basic CUID length check, adjust if using different ID format
    .withMessage('Translator ID format appears incorrect.')
    .custom(async (value) => {
      if (value) {
        // Only check if a translatorId is provided
        const user = await prisma.user.findUnique({ where: { id: value } });
        if (!user) {
          throw new Error(`Translator with ID '${value}' not found.`);
        }
      }
      return true;
    }),
  // handleValidationErrors // Called after all validators in the route
];

// Validator for the request body of Chapter Translations (POST and PUT)
const validateChapterTranslationBody = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Translated chapter title must be at most 255 characters.'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Translated chapter content is required.'),
  body('languageCode') // Required for POST if languageCode is not in URL params
    .if((value, { req }) => req.method === 'POST' && !req.params.languageCode)
    .trim()
    .notEmpty()
    .withMessage(
      'Language code in body is required for adding new translation.'
    )
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters.')
    .custom(async (value) => {
      const language = await prisma.language.findUnique({
        where: { code: value },
      });
      if (!language || !language.isActive) {
        throw new Error(`Language code '${value}' is not valid or not active.`);
      }
      return true;
    }),
  body('translatorId')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Translator ID must be a string (CUID).')
    .isLength({ min: 20, max: 30 })
    .withMessage('Translator ID format appears incorrect.')
    .custom(async (value) => {
      if (value) {
        const user = await prisma.user.findUnique({ where: { id: value } });
        if (!user) {
          throw new Error(`Translator with ID '${value}' not found.`);
        }
      }
      return true;
    }),
  // handleValidationErrors
];

module.exports = {
  handleValidationErrors, // Export this to be used in routes after the validation chains
  validateLanguageCodeParam,
  validateNovelIdParam,
  validateChapterIdParam,
  validateNovelTranslationBody,
  validateChapterTranslationBody,
};
