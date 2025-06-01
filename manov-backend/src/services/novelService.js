// File: src/services/novelService.js

const prisma = require("../lib/prisma");

/**
 * Generates a URL-friendly slug from a title and ensures uniqueness.
 * @param {string} title - The title to slugify.
 * @param {number} [excludeId=null] - Optional novel ID to exclude from uniqueness check (for updates).
 * @returns {Promise<string>} A unique slug.
 */
async function generateUniqueSlug(title, excludeId = null) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text

  if (!slug) {
    // Handle cases where title results in an empty slug (e.g., title with only special chars)
    slug = `novel-${Date.now()}`;
  }

  let uniqueSlug = slug;
  let counter = 1;
  let existingNovel = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const whereClause = { slug: uniqueSlug };
    if (excludeId) {
      whereClause.NOT = { id: parseInt(excludeId, 10) };
    }
    existingNovel = await prisma.novel.findUnique({ where: whereClause });
    if (!existingNovel) {
      break;
    }
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }
  return uniqueSlug;
}

/**
 * Creates a new novel.
 * @param {object} novelData - Data for the new novel.
 * @returns {Promise<object>} The created novel object.
 * @throws {Error} If required fields are missing, author not found, or other database error.
 */
async function createNovel(novelData) {
  const {
    title, // Original title
    authorId,
    originalLanguage,
    titleTranslated,
    synopsis,
    coverImageUrl,
    sourceUrl,
    publicationStatus, // Enum: ONGOING, COMPLETED, HIATUS, DROPPED
    translationStatus, // Enum: ACTIVE, PAUSED, COMPLETED, DROPPED
    genreTags, // String array
    totalChapters,
    firstPublishedAt,
    // lastUpdatedAt will be set by Prisma's @updatedAt on the record, or manually for content updates
    isActive,
  } = novelData;

  if (!title || !authorId || !originalLanguage) {
    throw new Error("Title, author ID, and original language are required.");
  }

  // Check if author exists
  const author = await prisma.author.findUnique({
    where: { id: parseInt(authorId, 10) },
  });
  if (!author) {
    throw new Error(`Author with ID ${authorId} not found.`);
  }

  const slug = await generateUniqueSlug(titleTranslated || title);

  try {
    const newNovel = await prisma.novel.create({
      data: {
        title,
        authorId: parseInt(authorId, 10),
        originalLanguage,
        slug,
        titleTranslated,
        synopsis,
        coverImageUrl,
        sourceUrl,
        publicationStatus: publicationStatus || "ONGOING", // Default if not provided
        translationStatus: translationStatus || "ACTIVE", // Default if not provided
        genreTags: genreTags || [], // Default to empty array
        totalChapters: totalChapters ? parseInt(totalChapters, 10) : null,
        firstPublishedAt: firstPublishedAt ? new Date(firstPublishedAt) : null,
        isActive: isActive !== undefined ? isActive : true,
        // viewCount, favoriteCount, averageRating default in schema
      },
      include: {
        author: {
          // Include author details in the response
          select: { id: true, name: true, nameRomanized: true },
        },
      },
    });
    return newNovel;
  } catch (error) {
    console.error("Error creating novel:", error);
    // Handle specific Prisma errors if needed (e.g., foreign key constraint failure if authorId was invalid despite check)
    throw error;
  }
}

/**
 * Retrieves all novels with filtering, pagination, and author details.
 * @param {object} [filters={}] - Optional filters.
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @param {object} [orderBy={ updatedAt: 'desc' }] - Optional sorting.
 * @returns {Promise<Array<object>>} An array of novel objects.
 */
async function getAllNovels(
  filters = {},
  pagination = {},
  orderBy = { updatedAt: "desc" },
) {
  const { skip, take } = pagination;
  const where = { ...filters }; // Example: { isActive: true, publicationStatus: 'ONGOING' }

  return prisma.novel.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, nameRomanized: true },
      },
    },
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });
}

/**
 * Retrieves a specific novel by its ID or slug, including author details.
 * @param {string|number} identifier - The ID or slug of the novel.
 * @returns {Promise<object|null>} The novel object if found, otherwise null.
 */
async function getNovelByIdentifier(identifier) {
  const isNumericId = /^\d+$/.test(identifier);
  let novel;

  if (isNumericId) {
    const novelId = parseInt(identifier, 10);
    if (isNaN(novelId)) return null;
    novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        author: { select: { id: true, name: true, nameRomanized: true } },
        // Add other relations to include as needed:
        // chapters: { orderBy: { chapterNumber: 'asc' }, select: { id: true, chapterNumber: true, title: true, isPublished: true } },
        // ratings: true, // or select specific fields
      },
    });
  } else {
    novel = await prisma.novel.findUnique({
      where: { slug: identifier },
      include: {
        author: { select: { id: true, name: true, nameRomanized: true } },
        // chapters: { orderBy: { chapterNumber: 'asc' }, select: { id: true, chapterNumber: true, title: true, isPublished: true } },
      },
    });
  }
  return novel;
}

/**
 * Updates an existing novel.
 * @param {number} id - The ID of the novel to update.
 * @param {object} novelData - The data to update.
 * @returns {Promise<object>} The updated novel object.
 * @throws {Error} If novel not found, author not found, or other database error.
 */
async function updateNovel(id, novelData) {
  const novelId = parseInt(id, 10);
  if (isNaN(novelId)) {
    throw new Error("Invalid novel ID format.");
  }

  const {
    title,
    authorId,
    originalLanguage,
    titleTranslated,
    firstPublishedAt,
    totalChapters,
    ...restOfData
  } = novelData;
  const dataToUpdate = { ...restOfData };

  if (title !== undefined) dataToUpdate.title = title;
  if (originalLanguage !== undefined)
    dataToUpdate.originalLanguage = originalLanguage;
  if (titleTranslated !== undefined)
    dataToUpdate.titleTranslated = titleTranslated;

  if (authorId !== undefined) {
    const authorExists = await prisma.author.findUnique({
      where: { id: parseInt(authorId, 10) },
    });
    if (!authorExists) {
      throw new Error(`Author with ID ${authorId} not found.`);
    }
    dataToUpdate.authorId = parseInt(authorId, 10);
  }

  // If title or titleTranslated changes, slug might need regeneration
  const currentNovel = await prisma.novel.findUnique({
    where: { id: novelId },
  });
  if (!currentNovel) {
    throw new Error(`Novel with ID ${novelId} not found.`);
  }
  if (titleTranslated && titleTranslated !== currentNovel.titleTranslated) {
    dataToUpdate.slug = await generateUniqueSlug(titleTranslated, novelId);
  } else if (title && title !== currentNovel.title && !titleTranslated) {
    // If titleTranslated is not being set, and original title changes, update slug from original title
    dataToUpdate.slug = await generateUniqueSlug(title, novelId);
  }

  if (firstPublishedAt !== undefined) {
    dataToUpdate.firstPublishedAt = firstPublishedAt
      ? new Date(firstPublishedAt)
      : null;
  }
  if (totalChapters !== undefined) {
    dataToUpdate.totalChapters = totalChapters
      ? parseInt(totalChapters, 10)
      : null;
  }
  // lastUpdatedAt for content can be set explicitly here if needed,
  // or rely on the automatic @updatedAt for general record updates.
  // dataToUpdate.lastUpdatedAt = new Date(); // Example if a chapter was added/content changed

  try {
    return await prisma.novel.update({
      where: { id: novelId },
      data: dataToUpdate,
      include: {
        author: { select: { id: true, name: true, nameRomanized: true } },
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Record to update not found
      throw new Error(`Novel with ID ${novelId} not found.`);
    }
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      throw new Error(
        `Slug generated for this title already exists. Please adjust title or titleTranslated.`,
      );
    }
    console.error("Error updating novel:", error);
    throw error;
  }
}

/**
 * Deletes a novel by its ID.
 * This will also delete related chapters, ratings, etc., due to cascading deletes in the schema.
 * @param {number} id - The ID of the novel to delete.
 * @returns {Promise<object>} The deleted novel object.
 * @throws {Error} If novel not found or other database error.
 */
async function deleteNovel(id) {
  const novelId = parseInt(id, 10);
  if (isNaN(novelId)) {
    throw new Error("Invalid novel ID format.");
  }
  try {
    // Cascading deletes for chapters, ratings, etc., should be handled by Prisma schema definitions.
    return await prisma.novel.delete({
      where: { id: novelId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      // Record to delete not found
      throw new Error(`Novel with ID ${novelId} not found.`);
    }
    console.error("Error deleting novel:", error);
    throw error;
  }
}

module.exports = {
  createNovel,
  getAllNovels,
  getNovelByIdentifier,
  updateNovel,
  deleteNovel,
};
