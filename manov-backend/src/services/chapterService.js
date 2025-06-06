// File: src/services/chapterService.js

const prisma = require('../lib/prisma');

/**
 * Creates a new chapter for a novel.
 * (This function primarily deals with the default language content)
 * @param {number} novelId - The ID of the novel this chapter belongs to.
 * @param {object} chapterData - Data for the new chapter.
 * @returns {Promise<object>} The created chapter object.
 * @throws {Error} If novel not found, chapter number conflict, or other database error.
 */
async function createChapter(novelId, chapterData) {
  const parentNovelId = parseInt(novelId, 10);
  if (isNaN(parentNovelId)) {
    throw new Error('Invalid novel ID format.');
  }

  const {
    chapterNumber,
    title, // Default title
    content, // Default content
    wordCount,
    isPublished,
    publishedAt: chapterPublishedAtInput, // Renamed to avoid confusion
    translatorNotes,
    originalChapterUrl,
    readingTimeEstimate,
  } = chapterData;

  if (chapterNumber === undefined || !content) {
    throw new Error('Chapter number and content are required.');
  }

  const novel = await prisma.novel.findUnique({ where: { id: parentNovelId } });
  if (!novel) {
    throw new Error(`Novel with ID ${parentNovelId} not found.`);
  }

  let publishedAtTimestamp = null;
  if (isPublished === true && !chapterPublishedAtInput) {
    publishedAtTimestamp = new Date();
  } else if (chapterPublishedAtInput) {
    publishedAtTimestamp = new Date(chapterPublishedAtInput);
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
        novel: { select: { id: true, title: true, slug: true } },
      },
    });
    return newChapter;
  } catch (error) {
    if (
      error.code === 'P2002' &&
      error.meta?.target?.includes('novelId') &&
      error.meta?.target?.includes('chapterNumber')
    ) {
      throw new Error(
        `Chapter number ${chapterNumber} already exists for novel ID ${parentNovelId}.`
      );
    }
    console.error('Error creating chapter:', error);
    throw error;
  }
}

/**
 * Retrieves all chapters for a specific novel, optionally applying translations.
 * @param {number} novelId - The ID of the novel.
 * @param {object} [filters={}] - Optional filters (e.g., { isPublished: true })
 * @param {object} [pagination={}] - Optional pagination { skip, take }
 * @param {object} [orderBy={ chapterNumber: 'asc' }] - Optional sorting.
 * @param {string} [languageCode] - Optional language code for translations.
 * @returns {Promise<Array<object>>} An array of chapter objects.
 */
async function getChaptersByNovelId(
  novelId,
  filters = {},
  pagination = {},
  orderBy = { chapterNumber: 'asc' },
  languageCode = null
) {
  const parentNovelId = parseInt(novelId, 10);
  if (isNaN(parentNovelId)) {
    throw new Error('Invalid novel ID format.');
  }

  const { skip, take } = pagination;
  const where = { novelId: parentNovelId, ...filters };

  const chaptersPromise = prisma.chapter.findMany({
    where,
    include: {
      novel: {
        select: { id: true, title: true, slug: true, originalLanguage: true },
      },
      // --- CORRECTED THIS BLOCK ---
      ...(languageCode && {
        chapterTranslations: {
          // Use 'chapterTranslations' instead of 'translations'
          where: { languageCode: languageCode },
          select: { title: true, content: true }, // Content is large, maybe omit for list view? For now, this matches the query.
        },
      }),
    },
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });

  const totalCountPromise = prisma.chapter.count({ where });

  const [chapters, totalCount] = await Promise.all([
    chaptersPromise,
    totalCountPromise,
  ]);

  // The mapping logic also needs to be updated to look for 'chapterTranslations'
  const results = chapters.map((chapter) => {
    // --- CORRECTED THIS LINE ---
    const { chapterTranslations, novel, ...chapterBase } = chapter; // Use 'chapterTranslations'
    let servedTitle = chapterBase.title;
    let servedLang = novel.originalLanguage;

    if (languageCode && chapterTranslations && chapterTranslations.length > 0) {
      const specificTranslation = chapterTranslations[0];
      servedTitle =
        specificTranslation.title !== null &&
        specificTranslation.title !== undefined
          ? specificTranslation.title
          : servedTitle;
      servedLang = languageCode;
    }
    return {
      ...chapterBase,
      title: servedTitle,
      content: undefined,
      novel: { id: novel.id, title: novel.title, slug: novel.slug },
      servedLanguageCode: servedLang,
    };
  });
  return { results, totalCount };
}

/**
 * Retrieves a specific chapter by its ID, applying translation if languageCode is provided.
 * @param {number} id - The ID of the chapter.
 * @param {string} [languageCode] - Optional language code for translation.
 * @returns {Promise<object|null>} The chapter object if found, otherwise null.
 */
async function getChapterById(id, languageCode = null) {
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    return null;
  }

  const chapterBase = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      novel: {
        select: { id: true, title: true, slug: true, originalLanguage: true },
      },
    },
  });

  if (!chapterBase) return null;

  let finalTitle = chapterBase.title;
  let finalContent = chapterBase.content;
  let servedLanguageCode = chapterBase.novel.originalLanguage; // Default

  if (languageCode) {
    const translation = await prisma.chapterTranslation.findUnique({
      where: {
        chapterId_languageCode: {
          chapterId: chapterBase.id,
          languageCode: languageCode,
        },
      },
    });
    if (translation) {
      finalTitle =
        translation.title !== null && translation.title !== undefined
          ? translation.title
          : finalTitle;
      finalContent = translation.content;
      servedLanguageCode = languageCode;
    }
  }

  return {
    ...chapterBase,
    title: finalTitle,
    content: finalContent,
    servedLanguageCode,
  };
}

/**
 * Retrieves a specific chapter by novel ID and chapter number, applying translation.
 * @param {number} novelId - The ID of the novel.
 * @param {number|string} chapterNumber - The chapter number.
 * @param {string} [languageCode] - Optional language code for translation.
 * @returns {Promise<object|null>} The chapter object if found, otherwise null.
 */
async function getChapterByNovelAndNumber(
  novelId,
  chapterNumber,
  languageCode = null
) {
  const parentNovelId = parseInt(novelId, 10);
  const chapNum = parseFloat(chapterNumber);

  if (isNaN(parentNovelId) || isNaN(chapNum)) {
    throw new Error('Invalid novel ID or chapter number format.');
  }

  const chapterBase = await prisma.chapter.findUnique({
    where: {
      novelId_chapterNumber: {
        novelId: parentNovelId,
        chapterNumber: chapNum,
      },
    },
    include: {
      novel: {
        select: { id: true, title: true, slug: true, originalLanguage: true },
      },
    },
  });

  if (!chapterBase) return null;

  let finalTitle = chapterBase.title;
  let finalContent = chapterBase.content;
  let servedLanguageCode = chapterBase.novel.originalLanguage;

  if (languageCode) {
    const translation = await prisma.chapterTranslation.findUnique({
      where: {
        chapterId_languageCode: {
          chapterId: chapterBase.id,
          languageCode: languageCode,
        },
      },
    });
    if (translation) {
      finalTitle =
        translation.title !== null && translation.title !== undefined
          ? translation.title
          : finalTitle;
      finalContent = translation.content;
      servedLanguageCode = languageCode;
    }
  }
  return {
    ...chapterBase,
    title: finalTitle,
    content: finalContent,
    servedLanguageCode,
  };
}

/**
 * Updates an existing chapter.
 * (This function primarily deals with the default language content)
 * @param {number} id - The ID of the chapter to update.
 * @param {object} chapterData - The data to update.
 * @returns {Promise<object>} The updated chapter object.
 * @throws {Error} If chapter not found or other database error.
 */
async function updateChapter(id, chapterData) {
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    throw new Error('Invalid chapter ID format.');
  }

  const {
    chapterNumber,
    title,
    content,
    wordCount,
    isPublished,
    publishedAt: chapterPublishedAtInput, // Renamed
    translatorNotes,
    originalChapterUrl,
    readingTimeEstimate,
    // novelId should not be updatable here to prevent moving chapters between novels easily
  } = chapterData;

  const dataToUpdate = {};
  // Selectively add fields to dataToUpdate if they are provided in chapterData
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
    if (
      isPublished === true &&
      !chapterPublishedAtInput &&
      dataToUpdate.publishedAt === undefined
    ) {
      // only default if not provided
      dataToUpdate.publishedAt = new Date();
    } else if (isPublished === false) {
      dataToUpdate.publishedAt = null;
    }
  }
  if (chapterPublishedAtInput) {
    // If user sends a specific publishedAt
    dataToUpdate.publishedAt = new Date(chapterPublishedAtInput);
    if (dataToUpdate.isPublished === undefined) {
      // If isPublished wasn't set, but publishedAt is, then it's published
      dataToUpdate.isPublished = true;
    }
  }

  try {
    return await prisma.chapter.update({
      where: { id: chapterId },
      data: dataToUpdate,
      include: { novel: { select: { id: true, title: true, slug: true } } },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Chapter with ID ${chapterId} not found.`);
    }
    if (
      error.code === 'P2002' &&
      error.meta?.target?.includes('novelId') &&
      error.meta?.target?.includes('chapterNumber')
    ) {
      const currentChapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { novelId: true },
      });
      throw new Error(
        `Chapter number ${dataToUpdate.chapterNumber || 'given'} already exists for novel ID ${currentChapter?.novelId || 'unknown'}.`
      );
    }
    console.error('Error updating chapter:', error);
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
    throw new Error('Invalid chapter ID format.');
  }
  try {
    return await prisma.chapter.delete({
      where: { id: chapterId },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Chapter with ID ${chapterId} not found.`);
    }
    console.error('Error deleting chapter:', error);
    throw error;
  }
}

/**
 * Creates or updates a translation for a chapter.
 * @param {number} chapterId - The ID of the chapter.
 * @param {string} languageCode - The language code for the translation.
 * @param {object} translationData - Data for the translation { title?, content, translatorId? }.
 * @returns {Promise<object>} The created or updated chapter translation object.
 */
async function upsertChapterTranslation(
  chapterId,
  languageCode,
  translationData
) {
  const { title, content, translatorId } = translationData;
  const numericChapterId = parseInt(chapterId, 10);

  if (!languageCode || !content) {
    throw new Error(
      'Language code and content are required for chapter translation.'
    );
  }

  const chapterExists = await prisma.chapter.findUnique({
    where: { id: numericChapterId },
  });
  if (!chapterExists) {
    throw new Error(`Chapter with ID ${numericChapterId} not found.`);
  }

  const languageExists = await prisma.language.findUnique({
    where: { code: languageCode },
  });
  if (!languageExists || !languageExists.isActive) {
    throw new Error(
      `Language code '${languageCode}' is not valid or not active.`
    );
  }

  if (translatorId) {
    const userExists = await prisma.user.findUnique({
      where: { id: translatorId },
    });
    if (!userExists) {
      throw new Error(`User with ID ${translatorId} (translator) not found.`);
    }
  }

  return prisma.chapterTranslation.upsert({
    where: {
      chapterId_languageCode: {
        chapterId: numericChapterId,
        languageCode,
      },
    },
    update: {
      title: title !== undefined ? title : null, // Allow clearing title
      content,
      translatorId: translatorId || null,
    },
    create: {
      chapterId: numericChapterId,
      languageCode,
      title: title !== undefined ? title : null,
      content,
      translatorId: translatorId || null,
    },
    include: {
      language: true,
      translator: translatorId
        ? { select: { id: true, username: true, displayName: true } }
        : undefined,
    },
  });
}

/**
 * Deletes a translation for a chapter.
 * @param {number} chapterId - The ID of the chapter.
 * @param {string} languageCode - The language code of the translation to delete.
 * @returns {Promise<object>} The deleted chapter translation object.
 */
async function deleteChapterTranslation(chapterId, languageCode) {
  const numericChapterId = parseInt(chapterId, 10);
  try {
    return await prisma.chapterTranslation.delete({
      where: {
        chapterId_languageCode: {
          chapterId: numericChapterId,
          languageCode,
        },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(
        `Translation for chapter ID ${numericChapterId} in language '${languageCode}' not found.`
      );
    }
    throw error;
  }
}

/**
 * Retrieves all translations for a specific chapter.
 * @param {number} chapterId - The ID of the chapter.
 * @returns {Promise<Array<object>>} An array of chapter translation objects.
 */
async function getChapterTranslations(chapterId) {
  const numericChapterId = parseInt(chapterId, 10);
  return prisma.chapterTranslation.findMany({
    where: { chapterId: numericChapterId },
    include: {
      language: { select: { name: true, nativeName: true, code: true } },
      translator: { select: { id: true, username: true, displayName: true } }, // Translator info
    },
    orderBy: {
      languageCode: 'asc',
    },
  });
}

module.exports = {
  createChapter,
  getChaptersByNovelId,
  getChapterById,
  getChapterByNovelAndNumber,
  updateChapter,
  deleteChapter,
  upsertChapterTranslation,
  deleteChapterTranslation,
  getChapterTranslations,
};
