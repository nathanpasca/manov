// File: src/services/userService.js

const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

/**
 * Creates a new user (registers a user).
 * @param {object} userData - Data for the new user (username, email, password, etc.).
 * @returns {Promise<object>} The created user object (excluding password).
 * @throws {Error} If username or email already exists, or other database/validation error.
 */
async function createUser(userData) {
  const {
    username,
    email,
    password,
    displayName,
    avatarUrl,
    preferredLanguage,
    isAdmin,
    isActive,
  } = userData;

  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required.');
  }

  // Basic password validation (more robust in Phase 8 or with a library)
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds 10

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        displayName,
        avatarUrl,
        preferredLanguage: preferredLanguage || 'en', // Default if not provided
        isAdmin: isAdmin || false, // Default if not provided
        isActive: isActive !== undefined ? isActive : true, // Default if not provided
        // emailVerifiedAt and lastLoginAt will be set by other processes
      },
      // Select specific fields to return, excluding passwordHash
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        preferredLanguage: true,
        isAdmin: true, // You might want to exclude this too for non-admin contexts
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      if (error.meta?.target?.includes('username')) {
        throw new Error(`Username '${username}' is already taken.`);
      }
      if (error.meta?.target?.includes('email')) {
        throw new Error(`Email '${email}' is already registered.`);
      }
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Finds a user by their ID.
 * @param {string} id - The CUID of the user.
 * @returns {Promise<object|null>} The user object (excluding password) if found, otherwise null.
 */
async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true, // Consider if email should always be returned here or only for 'me'
      displayName: true,
      avatarUrl: true,
      preferredLanguage: true,
      readingPreferences: true,
      isAdmin: true, // For admin views or self-profile, otherwise exclude
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      emailVerifiedAt: true,
    },
  });
}

/**
 * Finds a user by username or email (useful for login).
 * IMPORTANT: This function returns the passwordHash and should only be used internally for authentication.
 * @param {string} usernameOrEmail - The username or email to search for.
 * @returns {Promise<object|null>} The user object (including passwordHash) if found, otherwise null.
 */
async function findUserByUsernameOrEmailWithPassword(usernameOrEmail) {
  return prisma.user.findFirst({
    // findFirst because username and email are unique
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    // Includes passwordHash for authentication purposes
  });
}

/**
 * Updates a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} profileData - The data to update (e.g., displayName, avatarUrl, preferredLanguage, readingPreferences).
 * @returns {Promise<object>} The updated user object (excluding password).
 * @throws {Error} If user not found or other database error.
 */
async function updateUserProfile(userId, profileData) {
  const { displayName, avatarUrl, preferredLanguage, readingPreferences } =
    profileData;

  // Construct data object with only provided fields to prevent accidental nulling
  const dataToUpdate = {};
  if (displayName !== undefined) dataToUpdate.displayName = displayName;
  if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
  if (preferredLanguage !== undefined)
    dataToUpdate.preferredLanguage = preferredLanguage;
  if (readingPreferences !== undefined)
    dataToUpdate.readingPreferences = readingPreferences;
  // Add other updatable profile fields here

  if (Object.keys(dataToUpdate).length === 0) {
    throw new Error('No profile data provided for update.');
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        // Return updated profile, excluding sensitive data
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        preferredLanguage: true,
        readingPreferences: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      // Record to update not found
      throw new Error(`User with ID ${userId} not found.`);
    }
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// --- NEW Admin-Specific Functions ---

/**
 * (Admin) Retrieves all users with pagination and filtering.
 * @param {object} [filters={}] - Optional filters (e.g., { isActive: true, isAdmin: false }).
 * @param {object} [pagination={}] - Optional pagination { skip, take }.
 * @param {object} [orderBy={ createdAt: 'desc' }] - Optional sorting.
 * @returns {Promise<Array<object>>} An array of user objects (excluding passwords).
 */
async function getAllUsersAdmin(filters = {}, pagination = {}, orderBy = { createdAt: 'desc' }) {
  const { skip, take } = pagination;
  return prisma.user.findMany({
    where: filters,
    select: { // Select fields appropriate for an admin listing
      id: true,
      username: true,
      email: true,
      displayName: true,
      isActive: true,
      isAdmin: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy,
    ...(take && { take: parseInt(take, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
  });
}

/**
 * (Admin) Updates a user's details by an administrator.
 * Allows updating fields like isActive, isAdmin, displayName, email.
 * Does NOT allow updating password directly here (should use a separate reset flow).
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Data to update (e.g., { isActive, isAdmin, displayName, email }).
 * @returns {Promise<object>} The updated user object (excluding password).
 * @throws {Error} If user not found, or email/username conflict.
 */
async function updateUserByAdmin(userId, updateData) {
  const { displayName, email, isActive, isAdmin, preferredLanguage, avatarUrl } = updateData;

  // Construct data object with only provided fields
  const dataToUpdate = {};
  if (displayName !== undefined) dataToUpdate.displayName = displayName;
  if (email !== undefined) dataToUpdate.email = email; // Admin changing email needs consideration for verification flow
  if (isActive !== undefined) dataToUpdate.isActive = isActive;
  if (isAdmin !== undefined) dataToUpdate.isAdmin = isAdmin;
  if (preferredLanguage !== undefined) dataToUpdate.preferredLanguage = preferredLanguage;
  if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
  // Password should not be updated directly here.

  if (Object.keys(dataToUpdate).length === 0) {
    throw new Error('No data provided for update.');
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { // Return relevant admin view fields
        id: true, username: true, email: true, displayName: true, avatarUrl: true,
        preferredLanguage: true, isActive: true, isAdmin: true, updatedAt: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') { // Record to update not found
      throw new Error(`User with ID ${userId} not found.`);
    }
    if (error.code === 'P2002') { // Unique constraint violation
      if (error.meta?.target?.includes('username') && dataToUpdate.username) {
        throw new Error(`Username '${dataToUpdate.username}' is already taken.`);
      }
      if (error.meta?.target?.includes('email') && dataToUpdate.email) {
        throw new Error(`Email '${dataToUpdate.email}' is already registered.`);
      }
    }
    console.error("Error updating user by admin:", error);
    throw error;
  }
}

/**
 * (Admin) Deletes a user (soft delete by setting isActive=false is preferred).
 * For hard delete, ensure cascading or cleanup is handled.
 * @param {string} userId - The ID of the user to "delete".
 * @returns {Promise<object>} The updated user object (if soft delete) or deleted object.
 */
async function deleteUserByAdmin(userId) {
  // For this example, we'll implement a soft delete by setting isActive to false.
  // If you want a hard delete, use prisma.user.delete()
  // and ensure you understand cascading implications.
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true, username: true, email: true, isActive: true, isAdmin: true,
      },
    });
    // If user was not found, prisma.user.update will throw P2025
    return user;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`User with ID ${userId} not found.`);
    }
    console.error("Error deactivating user by admin:", error);
    throw error;
  }
}


module.exports = {
  createUser,
  findUserById,
  findUserByUsernameOrEmailWithPassword,
  updateUserProfile,
  getAllUsersAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
};
