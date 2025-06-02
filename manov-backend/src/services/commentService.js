// File: src/services/commentService.js

const prisma = require('../lib/prisma');

/**
 * Creates a new comment (top-level or reply).
 * @param {string} userId - The ID of the user creating the comment.
 * @param {object} commentData - Data for the comment { content, novelId?, chapterId?, parentId? }.
 * @returns {Promise<object>} The created comment object.
 * @throws {Error} If required fields are missing, or referenced entities (novel, chapter, parentComment) don't exist.
 */
async function createComment(userId, commentData) {
  const { content, novelId, chapterId, parentId } = commentData;

  if (!content) {
    throw new Error('Comment content is required.');
  }

  const data = {
    userId,
    content,
    novelId: novelId ? parseInt(novelId, 10) : null,
    chapterId: chapterId ? parseInt(chapterId, 10) : null,
    parentId: parentId || null, // Ensure parentId is null if not provided
  };

  // Application-level validation:
  // A top-level comment (no parentId) should have EITHER novelId OR chapterId.
  // A reply (parentId is present) might inherit novelId/chapterId from parent or have them null.
  if (!parentId) { // Top-level comment
    if (!data.novelId && !data.chapterId) {
      throw new Error('A top-level comment must be associated with either a novel or a chapter.');
    }
    if (data.novelId && data.chapterId) {
      throw new Error('A top-level comment cannot be associated with both a novel and a chapter.');
    }
    // Check if novel/chapter exists
    if (data.novelId && !(await prisma.novel.findUnique({ where: { id: data.novelId } }))) {
        throw new Error(`Novel with ID ${data.novelId} not found.`);
    }
    if (data.chapterId && !(await prisma.chapter.findUnique({ where: { id: data.chapterId } }))) {
        throw new Error(`Chapter with ID ${data.chapterId} not found.`);
    }
  } else { // This is a reply
    const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parentComment) {
      throw new Error(`Parent comment with ID ${parentId} not found.`);
    }
    // For replies, explicitly set novelId and chapterId to match the parent's context
    // or allow them to be different if your model supports cross-context replies.
    // Here, we copy from parent if they exist, otherwise they remain null (as per data object init).
    data.novelId = parentComment.novelId || null;
    data.chapterId = parentComment.chapterId || null;
  }


  try {
    return await prisma.comment.create({
      data,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        // For replies, you might want to include parent info or reply counts.
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error; // Re-throw for controller to handle
  }
}

/**
 * Retrieves comments for a novel (top-level comments with their replies).
 * @param {number} novelId - The ID of the novel.
 * @param {object} [pagination={}] - Optional pagination { skip, take } for top-level comments.
 * @param {object} [orderBy={ createdAt: 'desc' }] - Optional sorting for top-level comments.
 * @returns {Promise<Array<object>>} An array of comment objects with nested replies.
 */
async function getCommentsForNovel(novelId, pagination = {}, orderBy = { createdAt: 'desc' }) {
  const numericNovelId = parseInt(novelId, 10);
  if (isNaN(numericNovelId)) {
    throw new Error('Invalid Novel ID format.');
  }
  const { skip, take } = pagination;

  return prisma.comment.findMany({
    where: {
      novelId: numericNovelId,
      parentId: null, // Fetch only top-level comments
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      replies: { // Include direct replies
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          // You can nest further for replies to replies, but be cautious of depth and performance.
          // replies: { include: { user: {select: {id: true, username: true}} } }
        },
        orderBy: { createdAt: 'asc' }, // Replies usually oldest first within a thread
      },
    },
    orderBy, // Sort top-level comments
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });
}

/**
 * Retrieves comments for a chapter (top-level comments with their replies).
 * @param {number} chapterId - The ID of the chapter.
 * @param {object} [pagination={}] - Optional pagination { skip, take } for top-level comments.
 * @param {object} [orderBy={ createdAt: 'desc' }] - Optional sorting for top-level comments.
 * @returns {Promise<Array<object>>} An array of comment objects with nested replies.
 */
async function getCommentsForChapter(chapterId, pagination = {}, orderBy = { createdAt: 'desc' }) {
  const numericChapterId = parseInt(chapterId, 10);
  if (isNaN(numericChapterId)) {
    throw new Error('Invalid Chapter ID format.');
  }
  const { skip, take } = pagination;

  return prisma.comment.findMany({
    where: {
      chapterId: numericChapterId,
      parentId: null, // Fetch only top-level comments
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });
}

/**
 * Updates an existing comment.
 * @param {string} commentId - The ID of the comment to update.
 * @param {string} userId - The ID of the user attempting the update (for ownership check).
 * @param {object} commentData - The data to update { content }.
 * @returns {Promise<object>} The updated comment object.
 * @throws {Error} If comment not found, user is not owner, or other database error.
 */
async function updateComment(commentId, userId, commentData) {
  const { content } = commentData;
  if (!content || content.trim() === "") {
    throw new Error('Comment content cannot be empty for an update.');
  }

  const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existingComment) {
    throw new Error(`Comment with ID ${commentId} not found.`);
  }
  if (existingComment.userId !== userId) {
    // This check should ideally be in the controller before calling service,
    // or service needs to know if user is admin to bypass.
    // For now, service enforces ownership.
    throw new Error('User is not authorized to update this comment.');
  }

  try {
    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true, // Mark comment as edited
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
  } catch (error) {
    // P2025: Record to update not found (already handled by manual check, but good fallback)
    if (error.code === 'P2025') {
      throw new Error(`Comment with ID ${commentId} not found.`);
    }
    console.error("Error updating comment:", error);
    throw error;
  }
}

/**
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @param {string} userId - The ID of the user attempting the delete (for ownership check).
 * @param {boolean} isAdmin - Whether the user attempting the delete is an admin.
 * @returns {Promise<object>} The deleted comment object.
 * @throws {Error} If comment not found, user is not owner (and not admin), or other database error.
 */
async function deleteComment(commentId, userId, isAdmin = false) {
  const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existingComment) {
    throw new Error(`Comment with ID ${commentId} not found.`);
  }

  // Ownership check (admin bypasses this)
  if (!isAdmin && existingComment.userId !== userId) {
    throw new Error('User is not authorized to delete this comment.');
  }

  try {
    // Prisma schema relation "CommentReplies" on parent Comment has onDelete: Cascade.
    // So deleting a parent comment should cascade delete its replies.
    return await prisma.comment.delete({
      where: { id: commentId },
    });
  } catch (error) {
    if (error.code === 'P2025') { // Record to delete not found
      throw new Error(`Comment with ID ${commentId} not found.`);
    }
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// Helper to get a comment by ID, e.g., for ownership checks before update/delete in controller
async function getCommentById(commentId) {
    return prisma.comment.findUnique({
        where: { id: commentId },
        include: { user: {select: {id: true, username: true} } } // Include user to check ownership
    });
}


module.exports = {
  createComment,
  getCommentsForNovel,
  getCommentsForChapter,
  updateComment,
  deleteComment,
  getCommentById,
};