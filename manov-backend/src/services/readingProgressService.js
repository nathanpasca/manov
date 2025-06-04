// File: src/services/readingProgressService.js

const prisma = require('../lib/prisma');

/**
 * Saves or updates reading progress for a user and novel.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel.
 * @param {object} progressData - Progress data { chapterId, readingPosition, progressPercentage }.
 * @returns {Promise<object>} The created or updated reading progress object.
 * @throws {Error} If novel or chapter not found, or other database error.
 */
async function upsertReadingProgress(userId, novelId, progressData) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  const { chapterId, readingPosition, progressPercentage } = progressData;

  if (chapterId === undefined) {
    // chapterId is crucial for knowing where they are.
    throw new Error('chapterId is required to save progress.');
  }
  const numericChapterId = parseInt(chapterId, 10);
  if (isNaN(numericChapterId)) {
    throw new Error('Invalid Chapter ID format.');
  }

  // Optional: Validate that novelId and chapterId exist and chapter belongs to novel
  const chapterExists = await prisma.chapter.findFirst({
    where: { id: numericChapterId, novelId: numericNovelId },
  });
  if (!chapterExists) {
    throw new Error(
      `Chapter ID ${numericChapterId} not found or does not belong to Novel ID ${numericNovelId}.`
    );
  }

  const dataPayload = {
    userId,
    novelId: numericNovelId,
    chapterId: numericChapterId,
    readingPosition, // Can be null
    // progressPercentage is optional in schema, handle if it's undefined or null
    ...(progressPercentage !== undefined &&
      progressPercentage !== null &&
      !isNaN(parseInt(progressPercentage, 10)) && {
        progressPercentage: parseInt(progressPercentage, 10),
      }),
    lastReadAt: new Date(), // Explicitly set, though @updatedAt on model would also work
  };

  return prisma.readingProgress.upsert({
    where: {
      userId_novelId: {
        // This refers to the @@unique constraint
        userId,
        novelId: numericNovelId,
      },
    },
    update: dataPayload,
    create: dataPayload,
    include: {
      // Optionally include some details for the response
      novel: { select: { id: true, title: true, slug: true } },
      chapter: { select: { id: true, chapterNumber: true, title: true } },
    },
  });
}

/**
 * Retrieves reading progress for a specific novel for a user.
 * @param {string} userId - The ID of the user.
 * @param {number} novelId - The ID of the novel.
 * @returns {Promise<object|null>} The reading progress object if found, otherwise null.
 */
async function getReadingProgress(userId, novelId) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }

  return prisma.readingProgress.findUnique({
    where: {
      userId_novelId: {
        userId,
        novelId: numericNovelId,
      },
    },
    include: {
      novel: {
        select: { id: true, title: true, slug: true, coverImageUrl: true },
      },
      chapter: { select: { id: true, chapterNumber: true, title: true } },
    },
  });
}

/**
 * Retrieves all reading progress entries for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} An array of reading progress objects.
 */
async function getAllReadingProgressForUser(userId, pagination = {}) {
  // Added pagination param
  const { skip, take } = pagination;
  const where = { userId };

  const progressPromise = prisma.readingProgress.findMany({
    where,
    orderBy: {
      lastReadAt: 'desc',
    },
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          author: { select: { name: true, nameRomanized: true } },
        }, // Added nameRomanized
      },
      chapter: {
        select: { id: true, chapterNumber: true, title: true },
      },
    },
  });

  const totalCountPromise = prisma.readingProgress.count({ where });
  const [results, totalCount] = await Promise.all([
    progressPromise,
    totalCountPromise,
  ]);
  return { results, totalCount };
}

module.exports = {
  upsertReadingProgress,
  getReadingProgress,
  getAllReadingProgressForUser,
};
