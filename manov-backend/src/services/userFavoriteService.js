// File: src/services/userFavoriteService.js

const prisma = require('../lib/prisma');

/**
 * Adds a novel to a user's favorites.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel to favorite.
 * @returns {Promise<object>} The created UserFavorite object.
 * @throws {Error} If novel not found or if already favorited, or other database error.
 */
async function addFavorite(userId, novelId) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  // Check if novel exists
  const novel = await prisma.novel.findUnique({ where: { id: numericNovelId } });
  if (!novel) {
    throw new Error(`Novel with ID ${numericNovelId} not found.`);
  }

  try {
    // Create will fail if the unique constraint (userId, novelId) is violated
    // meaning it's already a favorite.
    const favorite = await prisma.userFavorite.create({
      data: {
        userId,
        novelId: numericNovelId,
        // notificationEnabled defaults to true as per schema
      },
      include: { // Include novel details in the response
        novel: {
            select: { id: true, title: true, slug: true, coverImageUrl: true }
        }
      }
    });

    // Optionally, increment favorite_count on the Novel model
    // This should ideally be in a transaction if you do it.
    await prisma.novel.update({
        where: { id: numericNovelId },
        data: { favoriteCount: { increment: 1 } }
    });

    return favorite;
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error(`Novel ID ${numericNovelId} is already in your favorites.`);
    }
    console.error("Error adding favorite:", error);
    throw error;
  }
}

/**
 * Removes a novel from a user's favorites.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel to unfavorite.
 * @returns {Promise<object>} The deleted UserFavorite object (or indicates success).
 * @throws {Error} If the favorite entry is not found or other database error.
 */
async function removeFavorite(userId, novelId) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  try {
    // delete will throw an error if the record to delete is not found based on the unique constraint.
    const deletedFavorite = await prisma.userFavorite.delete({
      where: {
        userId_novelId: { // This refers to the @@unique constraint
          userId,
          novelId: numericNovelId,
        },
      },
    });

    // Optionally, decrement favorite_count on the Novel model
    await prisma.novel.update({
        where: { id: numericNovelId },
        data: { favoriteCount: { decrement: 1 } }
    });
    // Ensure favoriteCount doesn't go below 0, though Prisma handles this by erroring if it does.
    // You might want to fetch the novel first and check current count if strict non-negative is required without error.

    return deletedFavorite; // Or simply return a success message
  } catch (error) {
    if (error.code === 'P2025') { // Record to delete not found
      throw new Error(`Novel ID ${numericNovelId} was not found in your favorites.`);
    }
    console.error("Error removing favorite:", error);
    throw error;
  }
}

/**
 * Retrieves all favorited novels for a user.
 * @param {string} userId - The ID of the user.
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @returns {Promise<Array<object>>} An array of UserFavorite objects, including novel details.
 */
async function getAllFavoritesForUser(userId, pagination = {}) {
  const { skip, take } = pagination;

  return prisma.userFavorite.findMany({
    where: { userId },
    orderBy: {
      addedAt: 'desc', // Show most recently favorited first
    },
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    include: {
      novel: { // Include details of the favorited novel
        select: {
          id: true,
          title: true,
          titleTranslated: true,
          slug: true,
          coverImageUrl: true,
          synopsis: true, // Maybe a shorter version or first few lines
          author: {
            select: { name: true, nameRomanized: true },
          },
          // Add other fields you want to display in the favorites list
        },
      },
    },
  });
}

module.exports = {
  addFavorite,
  removeFavorite,
  getAllFavoritesForUser,
};