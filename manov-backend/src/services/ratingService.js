// File: src/services/ratingService.js

const prisma = require('../lib/prisma');

/**
 * Calculates and updates the average rating for a novel.
 * @param {number} novelId - The ID of the novel.
 */
async function updateNovelAverageRating(novelId) {
  const numericNovelId = parseInt(novelId, 10);
  const ratingsAggregation = await prisma.rating.aggregate({
    where: { novelId: numericNovelId },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    }
  });

  const averageRating = ratingsAggregation._avg.rating ? parseFloat(ratingsAggregation._avg.rating.toFixed(1)) : null;
  // const ratingCount = ratingsAggregation._count.rating; // If you had a ratingCount field

  await prisma.novel.update({
    where: { id: numericNovelId },
    data: {
      averageRating: averageRating,
      // favoriteCount: ratingCount, // If you repurpose favoriteCount or add ratingCount
    },
  });
}

/**
 * Creates or updates a rating/review for a novel by a user.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel.
 * @param {object} ratingData - Data for the rating { rating, reviewText }.
 * @returns {Promise<object>} The created or updated rating object.
 * @throws {Error} If novel not found, invalid rating, or other database error.
 */
async function upsertRating(userId, novelId, ratingData) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  const { rating, reviewText } = ratingData;

  if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('Rating must be a number between 1 and 5.');
  }

  // Check if novel exists
  const novel = await prisma.novel.findUnique({ where: { id: numericNovelId } });
  if (!novel) {
    throw new Error(`Novel with ID ${numericNovelId} not found.`);
  }

  const dataPayload = {
    userId,
    novelId: numericNovelId,
    rating: parseInt(rating, 10),
    reviewText: reviewText !== undefined ? reviewText : null, // Allow null or empty string for reviewText
  };

  const result = await prisma.rating.upsert({
    where: {
      userId_novelId: { // From @@unique([userId, novelId])
        userId,
        novelId: numericNovelId,
      },
    },
    update: dataPayload,
    create: dataPayload,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      // novel: { select: { id: true, title: true, slug: true } } // Not usually needed when returning a rating
    },
  });

  // After creating/updating a rating, update the novel's average rating
  await updateNovelAverageRating(numericNovelId);

  return result;
}

/**
 * Retrieves all ratings for a specific novel.
 * @param {number} novelId - The ID of the novel.
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @returns {Promise<Array<object>>} An array of rating objects.
 */
async function getRatingsForNovel(novelId, pagination = {}) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  const { skip, take } = pagination;

  return prisma.rating.findMany({
    where: { novelId: numericNovelId },
    orderBy: {
      createdAt: 'desc', // Show newest ratings first
    },
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    include: {
      user: { // Include user details for displaying who made the rating
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });
}

/**
 * Retrieves a specific rating by a user for a novel.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel.
 * @returns {Promise<object|null>} The rating object if found, otherwise null.
 */
async function getUserRatingForNovel(userId, novelId) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  return prisma.rating.findUnique({
    where: {
      userId_novelId: {
        userId,
        novelId: numericNovelId,
      },
    },
    include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
    }
  });
}

/**
 * Deletes a rating made by a user for a novel.
 * @param {string} userId - The ID of the user who made the rating.
 * @param {number} novelId - The ID of the novel the rating is for.
 * @returns {Promise<object>} The deleted rating object.
 * @throws {Error} If rating not found or other database error.
 */
async function deleteRating(userId, novelId) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  try {
    const deletedRating = await prisma.rating.delete({
      where: {
        userId_novelId: {
          userId,
          novelId: numericNovelId,
        },
      },
    });

    // After deleting a rating, update the novel's average rating
    await updateNovelAverageRating(numericNovelId);

    return deletedRating;
  } catch (error) {
    if (error.code === 'P2025') { // Record to delete not found
      throw new Error(`Rating by user ${userId} for novel ID ${numericNovelId} not found.`);
    }
    console.error("Error deleting rating:", error);
    throw error;
  }
}

module.exports = {
  upsertRating,
  getRatingsForNovel,
  getUserRatingForNovel,
  deleteRating,
  updateNovelAverageRating
};