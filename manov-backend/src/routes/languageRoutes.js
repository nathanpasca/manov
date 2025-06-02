// File: src/routes/languageRoutes.js

const express = require('express');
const languageController = require('../controllers/languageController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { validateLanguageCreation, validateLanguageUpdate } = require('../validators/languageValidators');

const router = express.Router();

router.get('/', languageController.getAllLanguages);

// Apply validation middleware before the controller
router.post('/', 
    requireAuth, 
    requireAdmin, 
    validateLanguageCreation, 
    languageController.createLanguage
);

router.get('/:languageId', languageController.getLanguageById);

router.put('/:languageId', 
    requireAuth, 
    requireAdmin, 
    validateLanguageUpdate,
    languageController.updateLanguage
);

router.delete('/:languageId', requireAuth, requireAdmin, languageController.deleteLanguage);

module.exports = router;