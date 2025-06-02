// File: src/services/searchService.js

const prisma = require('../lib/prisma');

/**
 * Performs a search across specified content types.
 * @param {string} queryTerm - The term to search for.
 * @param {string} type - The type of content to search ('novels', 'authors').
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @returns {Promise<object>} An object containing search results and type.
 * @throws {Error} If invalid search type or other database error.
 */
async function performSearch(queryTerm, type = 'novels', pagination = {}) {
  const { skip, take } = pagination;
  const searchTerm = queryTerm.trim(); // Basic sanitization

  if (!searchTerm) {
    return { type, results: [], total: 0 }; // Return empty if search term is empty after trim
  }

  let results = [];
  let total = 0;

  // Prisma's 'insensitive' mode for case-insensitive search
  const searchMode = 'insensitive';

  if (type === 'novels') {
    const whereClause = {
      OR: [
        { title: { contains: searchTerm, mode: searchMode } },
        { titleTranslated: { contains: searchTerm, mode: searchMode } },
        { synopsis: { contains: searchTerm, mode: searchMode } },
        // Optionally search by author name related to the novel
        { author: { name: { contains: searchTerm, mode: searchMode } } },
        { author: { nameRomanized: { contains: searchTerm, mode: searchMode } } },
      ],
      isActive: true, // Only search active novels
    };

    results = await prisma.novel.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, nameRomanized: true },
        },
      },
      orderBy: {
        // Basic relevance: novels updated more recently might be more relevant
        // Or consider adding a more complex scoring/relevance mechanism if needed later
        updatedAt: 'desc',
      },
      ...(take && { take: parseInt(take, 10) }),
      ...(skip && { skip: parseInt(skip, 10) }),
      select: { // Select specific fields for search results
        id: true,
        title: true,
        titleTranslated: true,
        slug: true,
        synopsis: true, // Or a snippet
        coverImageUrl: true,
        author: { select: { id: true, name: true, nameRomanized: true } },
        publicationStatus: true,
        updatedAt: true,
      }
    });
    total = await prisma.novel.count({ where: whereClause });

  } else if (type === 'authors') {
    const whereClause = {
      OR: [
        { name: { contains: searchTerm, mode: searchMode } },
        { nameRomanized: { contains: searchTerm, mode: searchMode } },
        { biography: { contains: searchTerm, mode: searchMode } }, // Optional: search in biography
      ],
      isActive: true, // Only search active authors
    };
    results = await prisma.author.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
      ...(take && { take: parseInt(take, 10) }),
      ...(skip && { skip: parseInt(skip, 10) }),
      select: { // Select specific fields for author search results
          id: true,
          name: true,
          nameRomanized: true,
          profileImageUrl: true,
          biography: true, // Or a snippet
          // Add novel count if desired: _count: { select: { novels: true } }
      }
    });
    total = await prisma.author.count({ where: whereClause });

  } else {
    throw new Error(`Unsupported search type: ${type}`);
  }

  return {
    type,
    query: queryTerm,
    results,
    total,
    page: skip !== undefined && take !== undefined ? (skip / take) + 1 : undefined,
    limit: take !== undefined ? take : undefined,
  };
}

module.exports = {
  performSearch,
};