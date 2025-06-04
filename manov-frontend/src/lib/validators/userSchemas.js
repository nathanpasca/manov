import { z } from "zod"

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be between 3 and 30 characters." })
    .max(30, { message: "Username must be between 3 and 30 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain alphanumeric characters and underscores." }),
  email: z.string().email({ message: "Must be a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number. Special characters are allowed.",
    }),
  displayName: z
    .string()
    .min(1, { message: "Display name must be between 1 and 50 characters." })
    .max(50, { message: "Display name must be between 1 and 50 characters." })
    .optional()
    .or(z.literal("")), // Allow empty string for optional or trim if that's preferred.
  preferredLanguage: z
    .string()
    .min(2, { message: "Preferred language code should be 2-5 characters (e.g., en, pt-BR)." })
    .max(5, { message: "Preferred language code should be 2-5 characters (e.g., en, pt-BR)." })
    .optional()
    .or(z.literal("")), // e.g. 'en', 'id'
})

export const loginSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

export const profileUpdateSchema = z
  .object({
    displayName: z
      .string()
      .min(1, { message: "Display name must be between 1 and 50 characters if provided." })
      .max(50, { message: "Display name must be between 1 and 50 characters if provided." })
      .optional()
      .or(z.literal("")),
    avatarUrl: z.string().url({ message: "Avatar URL must be a valid URL if provided." }).optional().or(z.literal("")),
    preferredLanguage: z
      .string()
      .min(2, { message: "Preferred language code should be 2-5 characters if provided." })
      .max(5, { message: "Preferred language code should be 2-5 characters if provided." })
      .optional()
      .or(z.literal("")),
    readingPreferences: z
      .string()
      .refine(
        (val) => {
          if (val === "" || val === undefined || val === null) return true // Allow empty or undefined
          try {
            JSON.parse(val)
            return true
          } catch (e) {
            return false
          }
        },
        { message: "Reading preferences must be a valid JSON string if provided." }
      )
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      return Object.values(data).some((value) => value !== undefined && value !== "")
    },
    {
      message: "At least one field must be provided for update.",
      path: ["_error"], // You can assign this error to a general form error or a specific field
    }
  )
