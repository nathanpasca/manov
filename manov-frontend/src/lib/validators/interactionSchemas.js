import { z } from "zod"

export const ratingSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1 star.").max(5, "Rating cannot exceed 5 stars."),
  reviewText: z.string().max(5000, "Review text must be at most 5000 characters.").optional().or(z.literal("")), // Allow empty string
})

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty." })
    .max(5000, { message: "Comment must be at most 5000 characters." }),
})
