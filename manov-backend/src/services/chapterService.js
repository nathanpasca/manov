// File: src/services/chapterService.js

const prisma = require("../lib/prisma");

/**
 * Creates a new chapter for a novel.
 * @param {number} novelId - The ID of the novel this chapter belongs to.
 * @param {object} chapterData - Data for the new chapter.
 * @returns {Promise<object>} The created chapter object.
 * @throws {Error} If novel not found, chapter number conflict, or other database error.
 */
async function createChapter(novelId, chapterData) {
  const parentNovelId = parseInt(novelId, 10);
  if (isNaN(parentNovelId)) {
    throw new Error("Invalid novel ID format.");
  }

  const {
    chapterNumber,
    title,
    content,
    wordCount,
    isPublished,
    translatorNotes,
    originalChapterUrl,
    readingTimeEstimate,
  } = chapterData;

  if (chapterNumber === undefined || !content) {
    throw new Error("Chapter number and content are required.");
  }

  // Check if novel exists
  const novel = await prisma.novel.findUnique({ where: { id: parentNovelId } });
  if (!novel) {
    throw new Error(`Novel with ID ${parentNovelId} not found.`);
  }

  let publishedAtTimestamp = null;
  if (isPublished === true && !chapterData.publishedAt) {
    // if explicitly setting to published now
    publishedAtTimestamp = new Date();
  } else if (chapterData.publishedAt) {
    publishedAtTimestamp = new Date(chapterData.publishedAt);
  }

  try {
    const newChapter = await prisma.chapter.create({
      data: {
        novelId: parentNovelId,
        chapterNumber: parseFloat(chapterNumber),
        title,
        content,
        wordCount: wordCount ? parseInt(wordCount, 10) : null,
        isPublished: isPublished !== undefined ? isPublished : false,
        publishedAt: publishedAtTimestamp,
        translatorNotes,
        originalChapterUrl,
        readingTimeEstimate: readingTimeEstimate
          ? parseInt(readingTimeEstimate, 10)
          : null,
      },
      include: {
        // Optionally include novel basic info
        novel: { select: { id: true, title: true, slug: true } },
      },
    });
    return newChapter;
  } catch (error) {
    // P2002 for unique constraint violation (novelId, chapterNumber)
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("novelId") &&
      error.meta?.target?.includes("chapterNumber")
    ) {
      throw new Error(
        `Chapter number ${chapterNumber} already exists for novel ID ${parentNovelId}.`,
      );
    }
    console.error("Error creating chapter:", error);
    throw error;
  }
}

/**
 * Retrieves all chapters for a specific novel.
 * @param {number} novelId - The ID of the novel.
 * @param {object} [filters={}] - Optional filters (e.g., { isPublished: true })
 * @param {object} [pagination={}] - Optional pagination { skip, take }
 * @param {object} [orderBy={ chapterNumber: 'asc' }] - Optional sorting.
 * @returns {Promise<Array<object>>} An array of chapter objects.
 */
async function getChaptersByNovelId(
  novelId,
  filters = {},
  pagination = {},
  orderBy = { chapterNumber: "asc" },
) {
  const parentNovelId = parseInt(novelId, 10);
  if (isNaN(parentNovelId)) {
    throw new Error("Invalid novel ID format.");
  }

  const { skip, take } = pagination;
  const where = { novelId: parentNovelId, ...filters };

  return prisma.chapter.findMany({
    where,
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    // Optionally select fewer fields for list view
    // select: { id: true, chapterNumber: true, title: true, isPublished: true, publishedAt: true }
  });
}

/**
 * Retrieves a specific chapter by its ID.
 * @param {number} id - The ID of the chapter.
 * @returns {Promise<object|null>} The chapter object if found, otherwise null.
 */
async function getChapterById(id) {
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    return null;
  }
  return prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      // Optionally include novel basic info
      novel: { select: { id: true, title: true, slug: true } },
    },
  });
}

/**
 * Retrieves a specific chapter by novel ID and chapter number.
 * @param {number} novelId - The ID of the novel.
 * @param {number|string} chapterNumber - The chapter number (can be float like 1.5).
 * @returns {Promise<object|null>} The chapter object if found, otherwise null.
 */
async function getChapterByNovelAndNumber(novelId, chapterNumber) {
  const parentNovelId = parseInt(novelId, 10);
  const chapNum = parseFloat(chapterNumber);

  if (isNaN(parentNovelId) || isNaN(chapNum)) {
    throw new Error("Invalid novel ID or chapter number format.");
  }

  return prisma.chapter.findUnique({
    where: {
      novelId_chapterNumber: {
        // This refers to the @@unique([novelId, chapterNumber]) constraint
        novelId: parentNovelId,
        chapterNumber: chapNum,
      },
    },
    include: {
      novel: { select: { id: true, title: true, slug: true } },
    },
  });
}

/**
 * Updates an existing chapter.
 * @param {number} id - The ID of the chapter to update.
 * @param {object} chapterData - The data to update.
 * @returns {Promise<object>} The updated chapter object.
 * @throws {Error} If chapter not found or other database error.
 */
async function updateChapter(id, chapterData) {
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    throw new Error("Invalid chapter ID format.");
  }

  const {
    chapterNumber,
    title,
    content,
    wordCount,
    isPublished,
    publishedAt, // User might send this explicitly
    translatorNotes,
    originalChapterUrl,
    readingTimeEstimate,
    novelId, // Prevent changing novelId for now, could be a separate "move chapter" feature
  } = chapterData;

  const dataToUpdate = {};
  if (chapterNumber !== undefined)
    dataToUpdate.chapterNumber = parseFloat(chapterNumber);
  if (title !== undefined) dataToUpdate.title = title;
  if (content !== undefined) dataToUpdate.content = content;
  if (wordCount !== undefined)
    dataToUpdate.wordCount = wordCount ? parseInt(wordCount, 10) : null;
  if (translatorNotes !== undefined)
    dataToUpdate.translatorNotes = translatorNotes;
  if (originalChapterUrl !== undefined)
    dataToUpdate.originalChapterUrl = originalChapterUrl;
  if (readingTimeEstimate !== undefined)
    dataToUpdate.readingTimeEstimate = readingTimeEstimate
      ? parseInt(readingTimeEstimate, 10)
      : null;

  if (isPublished !== undefined) {
    dataToUpdate.isPublished = isPublished;
    if (isPublished === true && !publishedAt) {
      // If setting to published and no specific publishedAt is given
      dataToUpdate.publishedAt = new Date();
    } else if (isPublished === false) {
      // If unpublishing
      dataToUpdate.publishedAt = null; // Or keep old date? Business logic decision. Here we nullify.
    }
  }
  if (publishedAt) {
    // If user sends a specific publishedAt
    dataToUpdate.publishedAt = new Date(publishedAt);
    dataToUpdate.isPublished = true; // Implicitly, if it has a published date, it's published
  }

  try {
    return await prisma.chapter.update({
      where: { id: chapterId },
      data: dataToUpdate,
      include: { novel: { select: { id: true, title: true, slug: true } } },
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Record to update not found
      throw new Error(`Chapter with ID ${chapterId} not found.`);
    }
    // P2002 for unique constraint violation (novelId, chapterNumber)
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("novelId") &&
      error.meta?.target?.includes("chapterNumber")
    ) {
      const currentChapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { novelId: true },
      });
      throw new Error(
        `Chapter number ${dataToUpdate.chapterNumber || "given"} already exists for novel ID ${currentChapter?.novelId || "unknown"}.`,
      );
    }
    console.error("Error updating chapter:", error);
    throw error;
  }
}

/**
 * Deletes a chapter by its ID.
 * @param {number} id - The ID of the chapter to delete.
 * @returns {Promise<object>} The deleted chapter object.
 * @throws {Error} If chapter not found or other database error.
 */
async function deleteChapter(id) {
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    throw new Error("Invalid chapter ID format.");
  }
  try {
    return await prisma.chapter.delete({
      where: { id: chapterId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Record to delete not found
      throw new Error(`Chapter with ID ${chapterId} not found.`);
    }
    // Other potential errors (e.g., P2003 if chapter has foreign key constraints that are Restrict)
    console.error("Error deleting chapter:", error);
    throw error;
  }
}

module.exports = {
  createChapter,
  getChaptersByNovelId,
  getChapterById,
  getChapterByNovelAndNumber,
  updateChapter,
  deleteChapter,
};
