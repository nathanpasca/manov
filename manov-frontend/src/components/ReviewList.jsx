import React from "react"
import { ReviewItem } from "./ReviewItem"
import { LoadingSpinner } from "./LoadingSpinner"
import { ErrorMessage } from "./ErrorMessage"
import { PaginationControls } from "./PaginationControls" // If pagination is needed

export function ReviewList({ reviewsData, isLoading, isError, error, onEditReview, onDeleteReview, page, setPage }) {
  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />

  const reviews = reviewsData?.results || (Array.isArray(reviewsData) ? reviewsData : [])
  const totalPages = reviewsData?.totalPages || 1
  const currentPageFromApi = reviewsData?.page || 1

  if (!reviews || reviews.length === 0) {
    return <p className='text-muted-foreground text-center py-4'>No reviews yet. Be the first to write one!</p>
  }

  return (
    <div className='space-y-4'>
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onEdit={() => onEditReview(review)}
          onDelete={() => onDeleteReview(review.id)}
        />
      ))}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPageFromApi}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </div>
  )
}
