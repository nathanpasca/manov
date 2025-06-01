// File: src/services/authorService.js

const prisma = require("../lib/prisma"); // Using the shared Prisma Client instance

/**
 * Creates a new author.
 * @param {object} authorData - Data for the new author.
 * @returns {Promise<object>} The created author object.
 * @throws {Error} If required fields are missing or other database error.
 */
async function createAuthor(authorData) {
  const {
    name,
    originalLanguage,
    nameRomanized,
    biography,
    birthDate,
    deathDate,
    nationality,
    profileImageUrl,
    isActive,
  } = authorData;

  // Basic check for required fields (more robust validation in Phase 8)
  if (!name || !originalLanguage) {
    throw new Error("Author name and original language are required.");
  }

  try {
    const newAuthor = await prisma.author.create({
      data: {
        name,
        originalLanguage,
        nameRomanized,
        biography,
        birthDate: birthDate ? new Date(birthDate) : null, // Ensure dates are Date objects or null
        deathDate: deathDate ? new Date(deathDate) : null,
        nationality,
        profileImageUrl,
        isActive: isActive !== undefined ? isActive : true, // Default isActive if not provided
      },
    });
    return newAuthor;
  } catch (error) {
    // Handle potential errors, e.g., unique constraint if you add one later
    // For now, re-throwing generic error
    console.error("Error creating author:", error);
    throw error;
  }
}

/**
 * Retrieves all authors.
 * @param {object} [filters={}] - Optional filters (e.g., { isActive: true })
 * @param {object} [pagination={}] - Optional pagination (e.g., { skip, take })
 * @returns {Promise<Array<object>>} An array of author objects.
 */
async function getAllAuthors(filters = {}, pagination = {}) {
  const { skip, take } = pagination;
  return prisma.author.findMany({
    where: filters,
    orderBy: {
      name: "asc", // Optional: order by name
    },
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });
}

/**
 * Retrieves a specific author by their ID.
 * @param {number} id - The ID of the author.
 * @returns {Promise<object|null>} The author object if found, otherwise null.
 */
async function getAuthorById(id) {
  const authorId = parseInt(id, 10);
  if (isNaN(authorId)) {
    return null;
  }
  return prisma.author.findUnique({
    where: { id: authorId },
    // Optionally include related novels later if needed for an author detail page
    // include: { novels: true }
  });
}

/**
 * Updates an existing author.
 * @param {number} id - The ID of the author to update.
 * @param {object} authorData - The data to update.
 * @returns {Promise<object>} The updated author object.
 * @throws {Error} If author not found or other database error.
 */
async function updateAuthor(id, authorData) {
  const authorId = parseInt(id, 10);
  if (isNaN(authorId)) {
    throw new Error("Invalid author ID format.");
  }

  const { birthDate, deathDate, ...restOfData } = authorData;
  const dataToUpdate = { ...restOfData };

  if (birthDate !== undefined) {
    dataToUpdate.birthDate = birthDate ? new Date(birthDate) : null;
  }
  if (deathDate !== undefined) {
    dataToUpdate.deathDate = deathDate ? new Date(deathDate) : null;
  }

  try {
    return await prisma.author.update({
      where: { id: authorId },
      data: dataToUpdate,
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma error for record not found to update
      throw new Error(`Author with ID ${authorId} not found.`);
    }
    console.error("Error updating author:", error);
    throw error;
  }
}

/**
 * Deletes an author by their ID.
 * @param {number} id - The ID of the author to delete.
 * @returns {Promise<object>} The deleted author object.
 * @throws {Error} If author not found or other database error.
 */
async function deleteAuthor(id) {
  const authorId = parseInt(id, 10);
  if (isNaN(authorId)) {
    throw new Error("Invalid author ID format.");
  }
  try {
    // Important: Prisma schema for Author-Novel relation is likely Restrict onDelete.
    // This means an author cannot be deleted if they have novels.
    // The application logic might need to handle this gracefully or provide
    // a way for admins to reassign/delete novels first.
    return await prisma.author.delete({
      where: { id: authorId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma error for record not found to delete
      throw new Error(`Author with ID ${authorId} not found.`);
    }
    // P2003 is foreign key constraint failure (e.g., author still has novels and onDelete is Restrict)
    if (
      error.code === "P2003" &&
      error.meta?.field_name?.includes("Novel_authorId_fkey")
    ) {
      throw new Error(
        `Author with ID ${authorId} cannot be deleted because they are associated with existing novels.`,
      );
    }
    console.error("Error deleting author:", error);
    throw error;
  }
}

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
};
