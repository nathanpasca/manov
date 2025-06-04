import React from "react"
import { CommentItem } from "./CommentItem"
import { LoadingSpinner } from "./LoadingSpinner"
import { ErrorMessage } from "./ErrorMessage"
import { PaginationControls } from "./PaginationControls"

export function CommentList({
  commentsData,
  isLoading,
  isError,
  error,
  onPostReply,
  onEditComment,
  onDeleteComment,
  page,
  setPage,
  isSubmittingReply,
  isSubmittingEdit,
}) {
  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />

  const comments = commentsData?.results || (Array.isArray(commentsData) ? commentsData : [])
  const totalPages = commentsData?.totalPages || 1
  const currentPageFromApi = commentsData?.page || 1

  if (!comments || comments.length === 0) {
    return <p className='text-muted-foreground text-center py-4'>No comments yet. Start the conversation!</p>
  }

  return (
    <div className='space-y-3 divide-y divide-border/40'>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onPostReply}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          isSubmittingReply={isSubmittingReply}
          isSubmittingEdit={isSubmittingEdit}
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
