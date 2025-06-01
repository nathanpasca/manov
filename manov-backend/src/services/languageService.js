// File: src/services/languageService.js

// Import the shared Prisma Client instance
const prisma = require("../lib/prisma");

/**
 * Creates a new language.
 * @param {object} languageData - Data for the new language (code, name, nativeName).
 * @returns {Promise<object>} The created language object.
 * @throws {Error} If language code already exists or other database error.
 */
async function createLanguage(languageData) {
  try {
    const newLanguage = await prisma.language.create({
      data: languageData,
    });
    return newLanguage;
  } catch (error) {
    // Prisma specific error for unique constraint violation (e.g., duplicate code)
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      throw new Error(
        `Language with code '${languageData.code}' already exists.`,
      );
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Retrieves all languages.
 * @returns {Promise<Array<object>>} An array of language objects.
 */
async function getAllLanguages() {
  return prisma.language.findMany({
    orderBy: {
      name: "asc", // Optional: order by name
    },
  });
}

/**
 * Retrieves a specific language by its ID.
 * @param {number} id - The ID of the language.
 * @returns {Promise<object|null>} The language object if found, otherwise null.
 */
async function getLanguageById(id) {
  const languageId = parseInt(id, 10);
  if (isNaN(languageId)) {
    // Important: Handle cases where ID is not a valid number early.
    // Though route validation (Phase 8) should ideally catch this.
    return null;
  }
  return prisma.language.findUnique({
    where: { id: languageId },
  });
}

/**
 * Updates an existing language.
 * @param {number} id - The ID of the language to update.
 * @param {object} languageData - The data to update.
 * @returns {Promise<object>} The updated language object.
 * @throws {Error} If language not found or other database error.
 */
async function updateLanguage(id, languageData) {
  const languageId = parseInt(id, 10);
  if (isNaN(languageId)) {
    throw new Error("Invalid language ID format.");
  }
  try {
    return await prisma.language.update({
      where: { id: languageId },
      data: languageData,
    });
  } catch (error) {
    // Prisma error if record to update is not found
    if (error.code === "P2025") {
      throw new Error(`Language with ID ${languageId} not found.`);
    }
    // Handle potential unique constraint violation on 'code' if being updated
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      throw new Error(
        `Language with code '${languageData.code}' already exists.`,
      );
    }
    throw error;
  }
}

/**
 * Deletes a language by its ID.
 * @param {number} id - The ID of the language to delete.
 * @returns {Promise<object>} The deleted language object.
 * @throws {Error} If language not found or other database error.
 */
async function deleteLanguage(id) {
  const languageId = parseInt(id, 10);
  if (isNaN(languageId)) {
    throw new Error("Invalid language ID format.");
  }
  try {
    return await prisma.language.delete({
      where: { id: languageId },
    });
  } catch (error) {
    // Prisma error if record to delete is not found
    if (error.code === "P2025") {
      throw new Error(`Language with ID ${languageId} not found.`);
    }
    // Prisma error if the language is still referenced by other records (e.g., NovelTranslations)
    // and onDelete is Restrict (as per our schema).
    if (error.code === "P2003") {
      throw new Error(
        `Language with ID ${languageId} cannot be deleted because it is still in use.`,
      );
    }
    throw error;
  }
}

module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
};
