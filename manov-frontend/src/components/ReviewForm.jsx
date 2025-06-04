import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ratingSchema } from "@/lib/validators/interactionSchemas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { StarRatingInput } from "@/components/StarRating" // From previous step
import { useAuth } from "@/contexts/AuthContext"

export function ReviewForm({ novelId, open, onOpenChange, existingReview, onSubmitSuccess }) {
  const { user } = useAuth()
  const [currentRating, setCurrentRating] = useState(existingReview?.rating || 0)

  const form = useForm({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      reviewText: existingReview?.reviewText || "",
    },
  })

  useEffect(() => {
    if (existingReview) {
      form.reset({
        rating: existingReview.rating || 0,
        reviewText: existingReview.reviewText || "",
      })
      setCurrentRating(existingReview.rating || 0)
    } else {
      form.reset({ rating: 0, reviewText: "" })
      setCurrentRating(0)
    }
  }, [existingReview, form, open]) // Reset form when dialog opens or existingReview changes

  useEffect(() => {
    form.setValue("rating", currentRating, { shouldValidate: true })
  }, [currentRating, form])

  const handleSubmit = (data) => {
    if (!user) {
      // This should ideally be handled before opening the form
      toast.error("You must be logged in to submit a review.")
      return
    }
    if (data.rating === 0) {
      form.setError("rating", { type: "manual", message: "Please select a star rating." })
      return
    }
    onSubmitSuccess(data) // Pass data to parent for mutation
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{existingReview ? "Edit Your Review" : "Write a Review"}</DialogTitle>
          <DialogDescription>Share your thoughts about this novel with other readers.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4 py-4'>
            <FormField
              control={form.control}
              name='rating'
              render={(
                { field } // field is passed but we use currentRating for StarRatingInput
              ) => (
                <FormItem>
                  <FormLabel>
                    Your Rating <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <StarRatingInput rating={currentRating} setRating={setCurrentRating} size={7} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='reviewText'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us what you liked or disliked...'
                      className='resize-none min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
