// File: src/routes/adminRoutes.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

// User-related validators
const {
  validateUserIdParamForAdmin,
  validateAdminUserUpdate,
  validateAdminListUsersQuery,
} = require('../validators/adminUserValidators');

// Translation-related validators (assuming they are created in this new file)
// If validateNovelIdParam and validateChapterIdParam are in their respective files (novelValidators.js, chapterValidators.js),
// you would import them from there. For this example, let's assume they are consolidated or also available via translationValidators.
const {
  handleValidationErrors, // General error handler from express-validator
  validateNovelIdParam, // Assuming this validates :novelId
  validateChapterIdParam, // Assuming this validates :chapterId
  validateLanguageCodeParam, // Validates :languageCode path param
  validateNovelTranslationBody, // Validates body for novel translations
  validateChapterTranslationBody, // Validates body for chapter translations
} = require('../validators/translationValidators'); // Adjust path as necessary

const router = express.Router();

// Apply auth and admin protection to all routes in this file
router.use(requireAuth);
router.use(requireAdmin);

// === User Management Routes ===
router.get(
  '/users',
  validateAdminListUsersQuery, // Validates query params
  handleValidationErrors, // Handles errors from validateAdminListUsersQuery
  adminController.listAllUsers
);
router.get(
  '/users/:userId',
  validateUserIdParamForAdmin, // Validates :userId path param
  handleValidationErrors, // Handles errors from validateUserIdParamForAdmin
  adminController.getUserDetailsAdmin
);
router.put(
  '/users/:userId',
  validateUserIdParamForAdmin, // Validates :userId path param
  validateAdminUserUpdate, // Validates req.body
  handleValidationErrors, // Handles errors from both validators above
  adminController.updateUserDetailsAdmin
);
router.delete(
  '/users/:userId',
  validateUserIdParamForAdmin, // Validates :userId path param
  handleValidationErrors, // Handles errors from validateUserIdParamForAdmin
  adminController.deleteUserByAdmin
);

// === Novel Translations Management Routes ===
router.get(
  '/novels/:novelId/translations',
  validateNovelIdParam,
  handleValidationErrors,
  adminController.listNovelTranslationsAdmin
);
router.post(
  '/novels/:novelId/translations',
  validateNovelIdParam,
  validateNovelTranslationBody, // Validates req.body: {languageCode, title, synopsis, translatorId?}
  handleValidationErrors,
  adminController.addNovelTranslationAdmin
);
router.put(
  '/novels/:novelId/translations/:languageCode',
  validateNovelIdParam,
  validateLanguageCodeParam, // Validates :languageCode from URL
  validateNovelTranslationBody, // Validates req.body: {title, synopsis, translatorId?} - languageCode from body is ignored if in URL
  handleValidationErrors,
  adminController.updateNovelTranslationAdmin
);
router.delete(
  '/novels/:novelId/translations/:languageCode',
  validateNovelIdParam,
  validateLanguageCodeParam,
  handleValidationErrors,
  adminController.removeNovelTranslationAdmin
);

// === Chapter Translations Management Routes ===
router.get(
  '/chapters/:chapterId/translations',
  validateChapterIdParam,
  handleValidationErrors,
  adminController.listChapterTranslationsAdmin
);
router.post(
  '/chapters/:chapterId/translations',
  validateChapterIdParam,
  validateChapterTranslationBody, // Validates req.body: {languageCode, title?, content, translatorId?}
  handleValidationErrors,
  adminController.addChapterTranslationAdmin
);
router.put(
  '/chapters/:chapterId/translations/:languageCode',
  validateChapterIdParam,
  validateLanguageCodeParam, // Validates :languageCode from URL
  validateChapterTranslationBody, // Validates req.body: {title?, content, translatorId?}
  handleValidationErrors,
  adminController.updateChapterTranslationAdmin
);
router.delete(
  '/chapters/:chapterId/translations/:languageCode',
  validateChapterIdParam,
  validateLanguageCodeParam,
  handleValidationErrors,
  adminController.removeChapterTranslationAdmin
);

// Note: Routes for managing core novel/chapter entities (create novel, edit chapter details, etc.)
// would typically be in their own route files (e.g., novelRoutes.js, chapterRoutes.js) and also protected by requireAdmin.
// This adminRoutes.js can be for user management and *translation* management specifically,
// or you could choose to put all admin-only CRUD for novels/chapters here too.
// The current project structure seems to have admin CRUD for novels/chapters in their respective main route files,
// protected by requireAdmin. This is also a valid approach.
// These translation routes are added here assuming they are admin-specific operations.

module.exports = router;
