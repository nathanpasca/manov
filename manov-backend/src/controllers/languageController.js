// File: src/controllers/languageController.js

const languageService = require("../services/languageService");

async function createLanguage(req, res, next) {
  try {
    // Basic input validation (more robust validation in Phase 8)
    const { code, name, nativeName } = req.body;
    if (!code || !name) {
      // Important: Always validate required inputs
      return res.status(400).json({ message: "Code and name are required." });
    }

    const languageData = {
      code,
      name,
      nativeName,
      isActive: req.body.isActive,
    }; // isActive is optional
    const newLanguage = await languageService.createLanguage(languageData);
    res.status(201).json(newLanguage);
  } catch (error) {
    // Pass error to centralized error handler (to be implemented in Phase 8)
    // For now, a simple error response or specific handling for known errors
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    next(error);
  }
}

async function getAllLanguages(req, res, next) {
  try {
    const languages = await languageService.getAllLanguages();
    res.status(200).json(languages);
  } catch (error) {
    next(error);
  }
}

async function getLanguageById(req, res, next) {
  try {
    const { languageId } = req.params;
    const language = await languageService.getLanguageById(languageId);
    if (!language) {
      return res.status(404).json({ message: "Language not found." });
    }
    res.status(200).json(language);
  } catch (error) {
    next(error);
  }
}

async function updateLanguage(req, res, next) {
  try {
    const { languageId } = req.params;
    const languageData = req.body;

    // Basic validation: ensure at least one field is being updated
    if (Object.keys(languageData).length === 0) {
      return res.status(400).json({ message: "No data provided for update." });
    }

    const updatedLanguage = await languageService.updateLanguage(
      languageId,
      languageData,
    );
    res.status(200).json(updatedLanguage);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteLanguage(req, res, next) {
  try {
    const { languageId } = req.params;
    await languageService.deleteLanguage(languageId);
    res.status(204).send(); // No content to send back
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid language ID")
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("still in use")) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    next(error);
  }
}

module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
};
