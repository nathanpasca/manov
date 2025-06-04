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
