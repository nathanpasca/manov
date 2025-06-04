// File: src/services/novelService.js

const prisma = require('../lib/prisma');

/**
 * Generates a URL-friendly slug from a title and ensures uniqueness.
 * @param {string} title - The title to slugify.
 * @param {number} [excludeId=null] - Optional novel ID to exclude from uniqueness check (for updates).
 * @returns {Promise<string>} A unique slug.
 */
async function generateUniqueSlug(title, excludeId = null) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

  if (!slug) {
    // Handle cases where title results in an empty slug
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
    titleTranslated, // Default translated title (e.g., English)
    synopsis, // Default synopsis
    coverImageUrl,
    sourceUrl,
    publicationStatus,
    translationStatus,
    genreTags,
    totalChapters,
    firstPublishedAt,
    isActive,
  } = novelData;

  if (!title || !authorId || !originalLanguage) {
    throw new Error('Title, author ID, and original language are required.');
  }

  const author = await prisma.author.findUnique({
    where: { id: parseInt(authorId, 10) },
  });
  if (!author) {
    throw new Error(`Author with ID ${authorId} not found.`);
  }

  // Slug is typically generated from the most common translated title or original if not available
  const slug = await generateUniqueSlug(titleTranslated || title);

  try {
    const newNovel = await prisma.novel.create({
      data: {
        title,
        authorId: parseInt(authorId, 10),
        originalLanguage,
        slug,
        titleTranslated, // Store the default translation
        synopsis, // Store the default synopsis
        coverImageUrl,
        sourceUrl,
        publicationStatus: publicationStatus || 'ONGOING',
        translationStatus: translationStatus || 'ACTIVE',
        genreTags: genreTags || [],
        totalChapters: totalChapters ? parseInt(totalChapters, 10) : null,
        firstPublishedAt: firstPublishedAt ? new Date(firstPublishedAt) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        author: {
          select: { id: true, name: true, nameRomanized: true },
        },
      },
    });
    return newNovel;
  } catch (error) {
    console.error('Error creating novel:', error);
    throw error;
  }
}

/**
 * Retrieves all novels, optionally applying translations if a languageCode is provided.
 * @param {object} [filters={}] - Optional filters.
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @param {object} [orderBy={ updatedAt: 'desc' }] - Optional sorting.
 * @param {string} [languageCode] - Optional language code for translations.
 * @returns {Promise<Array<object>>} An array of novel objects.
 */
async function getAllNovels(
  filters = {},
  pagination = {},
  orderBy = { updatedAt: 'desc' },
  languageCode = null
) {
  const { skip, take } = pagination;
  const where = { ...filters };

  const novelsPromise = prisma.novel.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, nameRomanized: true },
      },
      ...(languageCode && {
        translations: {
          where: { languageCode: languageCode },
          select: { title: true, synopsis: true },
        },
      }),
    },
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });

  const totalCountPromise = prisma.novel.count({ where });

  const [novels, totalCount] = await Promise.all([
    novelsPromise,
    totalCountPromise,
  ]);

  // If languageCode was provided, merge translation data into the novel objects
  // Otherwise, ensure a servedLanguageCode field is present indicating the default was used.
  const results = novels.map((novel) => {
    // ... (existing mapping logic for translations) ...
    const { translations, ...novelBase } = novel;
    let servedTitle = novelBase.titleTranslated || novelBase.title;
    let servedSynopsis = novelBase.synopsis;
    let servedLang = novelBase.originalLanguage;

    if (languageCode && translations && translations.length > 0) {
      const specificTranslation = translations[0];
      servedTitle = specificTranslation.title;
      servedSynopsis = specificTranslation.synopsis;
      servedLang = languageCode;
    } else if (novelBase.titleTranslated) {
      if (languageCode === novelBase.originalLanguage) {
        servedTitle = novelBase.title;
        servedLang = novelBase.originalLanguage;
      } else {
        servedTitle = novelBase.titleTranslated || novelBase.title;
        // Assuming titleTranslated is in a consistent default language e.g. 'en'
        // This logic might need refinement based on your exact multilingual strategy
        servedLang = novelBase.titleTranslated
          ? novel.defaultTranslationLanguage || 'en'
          : novelBase.originalLanguage;
      }
    }
    return {
      ...novelBase,
      titleTranslated: servedTitle,
      synopsis: servedSynopsis,
      servedLanguageCode: servedLang,
    };
  });

  return { results, totalCount }; // Return results and totalCount
}

/**
 * Retrieves a specific novel by its ID or slug, applying translation if languageCode is provided.
 * @param {string|number} identifier - The ID or slug of the novel.
 * @param {string} [languageCode] - Optional language code for translation.
 * @returns {Promise<object|null>} The novel object if found, otherwise null.
 */
async function getNovelByIdentifier(identifier, languageCode = null) {
  const isNumericId = /^\d+$/.test(identifier);
  let novelBase;
  const includeClause = {
    author: { select: { id: true, name: true, nameRomanized: true } },
    chapters: {
      where: { isPublished: true }, // Example filter for chapters
      orderBy: { chapterNumber: 'asc' },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        isPublished: true,
        publishedAt: true,
      },
    },
    // We won't include all translations here, but fetch the specific one if languageCode is given.
  };

  if (isNumericId) {
    const novelId = parseInt(identifier, 10);
    if (isNaN(novelId)) return null;
    novelBase = await prisma.novel.findUnique({
      where: { id: novelId },
      include: includeClause,
    });
  } else {
    novelBase = await prisma.novel.findUnique({
      where: { slug: identifier },
      include: includeClause,
    });
  }

  if (!novelBase) return null;

  let finalTitleTranslated = novelBase.titleTranslated || novelBase.title; // Default
  let finalSynopsis = novelBase.synopsis;
  // Determine servedLanguageCode: if languageCode is provided & translation found, use it.
  // Else, if novelBase.titleTranslated exists, assume it's the site's default translation (e.g., 'en').
  // Else, fallback to novelBase.originalLanguage.
  let servedLanguageCode = novelBase.originalLanguage; // Fallback to original if no translations at all

  if (novelBase.titleTranslated) {
    // Assuming titleTranslated is in a consistent default language e.g. 'en'
    // This needs a clear convention. For now, let's just say it's the default.
    // If you have a field like `defaultTranslationLanguage` on Novel, use that.
    // For simplicity, if titleTranslated exists, we'll assume it's the primary display lang if no specific lang is requested
    servedLanguageCode = novelBase.originalLanguage; // This might be incorrect if titleTranslated is EN and original is ZH
    // A better default would be 'en' if titleTranslated is assumed to be English.
    // Or, the language of the `titleTranslated` field itself.
    // Let's refine this:
    if (languageCode === novelBase.originalLanguage) {
      finalTitleTranslated = novelBase.title; // Use original title if original lang is requested
      servedLanguageCode = novelBase.originalLanguage;
    } else {
      // Default to titleTranslated if it exists, otherwise original title
      finalTitleTranslated = novelBase.titleTranslated || novelBase.title;
      servedLanguageCode = novelBase.titleTranslated
        ? 'en'
        : novelBase.originalLanguage; // Placeholder logic for default translated lang
    }
  }

  if (languageCode) {
    const translation = await prisma.novelTranslation.findUnique({
      where: {
        novelId_languageCode: {
          novelId: novelBase.id,
          languageCode: languageCode,
        },
      },
    });
    if (translation) {
      finalTitleTranslated = translation.title;
      finalSynopsis = translation.synopsis;
      servedLanguageCode = languageCode;
    }
    // If specific translation not found, it will use the defaults established above
  }

  return {
    ...novelBase,
    titleTranslated: finalTitleTranslated,
    synopsis: finalSynopsis,
    servedLanguageCode,
  };
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
    throw new Error('Invalid novel ID format.');
  }

  const {
    title, // Original title
    authorId,
    originalLanguage,
    titleTranslated, // Default translated title
    synopsis, // Default synopsis
    firstPublishedAt,
    totalChapters,
    ...restOfData // other fields like coverImageUrl, sourceUrl, publicationStatus, etc.
  } = novelData;

  const dataToUpdate = { ...restOfData };

  if (title !== undefined) dataToUpdate.title = title;
  if (originalLanguage !== undefined)
    dataToUpdate.originalLanguage = originalLanguage;
  if (titleTranslated !== undefined)
    dataToUpdate.titleTranslated = titleTranslated;
  if (synopsis !== undefined) dataToUpdate.synopsis = synopsis;

  if (authorId !== undefined) {
    const numericAuthorId = parseInt(authorId, 10);
    if (isNaN(numericAuthorId))
      throw new Error('Invalid Author ID format for update.');
    const authorExists = await prisma.author.findUnique({
      where: { id: numericAuthorId },
    });
    if (!authorExists) {
      throw new Error(`Author with ID ${numericAuthorId} not found.`);
    }
    dataToUpdate.authorId = numericAuthorId;
  }

  const currentNovel = await prisma.novel.findUnique({
    where: { id: novelId },
  });
  if (!currentNovel) {
    throw new Error(`Novel with ID ${novelId} not found.`);
  }

  // Slug regeneration logic if relevant titles change
  let titleForSlug = currentNovel.titleTranslated || currentNovel.title;
  if (
    titleTranslated !== undefined &&
    titleTranslated !== currentNovel.titleTranslated
  ) {
    titleForSlug = titleTranslated;
    dataToUpdate.slug = await generateUniqueSlug(titleForSlug, novelId);
  } else if (
    title !== undefined &&
    title !== currentNovel.title &&
    (titleTranslated === undefined ||
      titleTranslated === currentNovel.titleTranslated)
  ) {
    // If original title changes and translated title isn't changing (or wasn't provided for update)
    // regenerate slug from new original title if no default translation exists, or from translated if it does.
    titleForSlug = currentNovel.titleTranslated || title; // Prioritize existing translated title for slug base, then new original title
    if (titleForSlug !== (currentNovel.titleTranslated || currentNovel.title)) {
      // Only regen if base for slug changed
      dataToUpdate.slug = await generateUniqueSlug(titleForSlug, novelId);
    }
  }

  if (firstPublishedAt !== undefined) {
    dataToUpdate.firstPublishedAt = firstPublishedAt
      ? new Date(firstPublishedAt)
      : null;
  }
  if (totalChapters !== undefined) {
    dataToUpdate.totalChapters =
      totalChapters !== null ? parseInt(totalChapters, 10) : null;
  }

  try {
    return await prisma.novel.update({
      where: { id: novelId },
      data: dataToUpdate,
      include: {
        author: { select: { id: true, name: true, nameRomanized: true } },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Novel with ID ${novelId} not found.`);
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      throw new Error(
        `Slug generated for this title already exists. Please adjust title or titleTranslated.`
      );
    }
    console.error('Error updating novel:', error);
    throw error;
  }
}

/**
 * Deletes a novel by its ID.
 * @param {number} id - The ID of the novel to delete.
 * @returns {Promise<object>} The deleted novel object.
 */
async function deleteNovel(id) {
  const novelId = parseInt(id, 10);
  if (isNaN(novelId)) {
    throw new Error('Invalid novel ID format.');
  }
  try {
    return await prisma.novel.delete({
      where: { id: novelId },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Novel with ID ${novelId} not found.`);
    }
    console.error('Error deleting novel:', error);
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
