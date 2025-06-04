import { z } from "zod"

export const adminUserUpdateSchema = z
  .object({
    displayName: z
      .string()
      .min(1, { message: "Display name must be between 1 and 50 characters if provided." })
      .max(50, { message: "Display name must be between 1 and 50 characters if provided." })
      .optional()
      .or(z.literal("")),
    email: z.string().email({ message: "Must be a valid email address if provided." }).optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
    preferredLanguage: z
      .string()
      .min(2, { message: "Preferred language code should be 2-5 characters if provided." })
      .max(5, { message: "Preferred language code should be 2-5 characters if provided." })
      .optional()
      .or(z.literal("")),
    avatarUrl: z.string().url({ message: "Avatar URL must be a valid URL if provided." }).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Ensure at least one field is present for update if making it strict
      return Object.keys(data).length > 0
    },
    {
      message: "At least one field must be provided for update.",
      path: ["_form"], // General form error
    }
  )

export const adminLanguageSchema = z.object({
  code: z
    .string()
    .min(2, "Language code must be between 2 and 10 characters.")
    .max(10, "Language code must be between 2 and 10 characters.")
    .regex(/^[a-zA-Z0-9-]+$/, "Language code must be alphanumeric or include hyphens."),
  name: z
    .string()
    .min(2, "Language name must be between 2 and 50 characters.")
    .max(50, "Language name must be between 2 and 50 characters."),
  nativeName: z
    .string()
    .min(1, "Native name is required.") // Made required based on schema, adjust if truly optional
    .max(50, "Native name must be at most 50 characters.")
    .optional()
    .or(z.literal("")), // Or make it non-optional if backend requires it
  isActive: z.boolean().default(true),
})

export const adminAuthorSchema = z
  .object({
    name: z.string().min(1, "Author name is required.").max(255),
    originalLanguage: z.string().min(2, "Original language code is required.").max(10),
    nameRomanized: z.string().max(255).optional().or(z.literal("")),
    biography: z.string().max(5000).optional().or(z.literal("")),
    birthDate: z.date().optional().nullable(), // Shadcn DatePicker gives Date object
    deathDate: z.date().optional().nullable(),
    nationality: z.string().max(100).optional().or(z.literal("")),
    profileImageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.birthDate && data.deathDate && data.deathDate < data.birthDate) {
        return false
      }
      return true
    },
    {
      message: "Death date must be after birth date.",
      path: ["deathDate"],
    }
  )

const publicationStatuses = z.enum(["ONGOING", "COMPLETED", "HIATUS", "DROPPED"])
const translationStatuses = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "DROPPED"])

export const adminNovelSchema = z.object({
  title: z.string().min(1, "Novel title is required.").max(255),
  authorId: z.coerce.number().int().positive("Author ID must be a positive integer."),
  originalLanguage: z.string().min(2, "Original language code is required.").max(10),

  // These are the default/primary translated fields on the Novel model itself
  titleTranslated: z.string().max(255).optional().or(z.literal("")),
  synopsis: z.string().max(10000, "Synopsis too long.").optional().or(z.literal("")),

  coverImageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  sourceUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  publicationStatus: publicationStatuses.default("ONGOING"),
  translationStatus: translationStatuses.default("ACTIVE"),
  genreTags: z.array(z.string().min(1).max(50)).optional().default([]),
  totalChapters: z.coerce.number().int().min(0, "Total chapters must be non-negative.").optional().nullable(),
  firstPublishedAt: z.date().optional().nullable(), // Date object from DatePicker
  isActive: z.boolean().default(true),
})

// Based on chapterValidators.js (validateChapterCreation/Update)
export const adminChapterSchema = z.object({
  chapterNumber: z.coerce.number().min(0, "Chapter number must be non-negative."),
  content: z.string().min(1, "Chapter content is required."), // Will use Textarea, RTE later
  title: z.string().max(255).optional().or(z.literal("")),
  wordCount: z.coerce.number().int().min(0).optional().nullable(),
  isPublished: z.boolean().default(false),
  publishedAt: z.date().optional().nullable(),
  translatorNotes: z.string().max(5000).optional().or(z.literal("")),
  originalChapterUrl: z.string().url().optional().or(z.literal("")),
  readingTimeEstimate: z.coerce.number().int().min(0).optional().nullable(),
})
