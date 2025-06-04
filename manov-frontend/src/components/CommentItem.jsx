import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { PenSquare, Trash2, MessageSquareReply, UserCircle } from "lucide-react"
import { CommentForm } from "./CommentForm" // For reply form

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onUpdateReply,
  isSubmittingReply,
  isSubmittingEdit,
}) {
  const { user } = useAuth()
  const isOwnComment = user && comment.user && user.id === comment.user.id
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const handleReplySubmit = (data, resetForm) => {
    onReply(comment.id, data.content, () => {
      resetForm()
      setShowReplyForm(false)
    })
  }

  const handleEditSubmit = (data, resetForm) => {
    onEdit(comment.id, data.content, () => {
      resetForm()
      setShowEditForm(false)
    })
  }

  return (
    <div className='flex space-x-3 py-3'>
      <Avatar className='mt-1'>
        <AvatarImage
          src={comment.user?.avatarUrl || undefined}
          alt={comment.user?.displayName || comment.user?.username}
        />
        <AvatarFallback>
          {comment.user?.displayName ? (
            comment.user.displayName.substring(0, 1).toUpperCase()
          ) : (
            <UserCircle size={20} />
          )}
        </AvatarFallback>
      </Avatar>
      <div className='flex-grow'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='font-semibold text-sm'>
              {comment.user?.displayName || comment.user?.username || "User"}
            </span>
            <span className='text-xs text-muted-foreground'>
              {new Date(comment.createdAt).toLocaleString()}
              {comment.isEdited && " (edited)"}
            </span>
          </div>
          {isOwnComment && !showEditForm && (
            <div className='space-x-0.5'>
              <Button variant='ghost' size='icon' onClick={() => setShowEditForm(true)} aria-label='Edit comment'>
                <PenSquare className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onDelete(comment.id)}
                aria-label='Delete comment'
                className='text-destructive hover:text-destructive'>
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>

        {showEditForm ? (
          <CommentForm
            onSubmit={handleEditSubmit}
            initialContent={comment.content}
            submitText='Update'
            placeholder='Edit your comment...'
            onCancel={() => setShowEditForm(false)}
            isSubmitting={isSubmittingEdit}
          />
        ) : (
          <p className='text-sm mt-1 whitespace-pre-line'>{comment.content}</p>
        )}

        {!showEditForm && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowReplyForm(!showReplyForm)}
            className='mt-1 text-xs px-2 py-1 h-auto text-muted-foreground'>
            <MessageSquareReply className='h-3 w-3 mr-1' /> Reply
          </Button>
        )}

        {showReplyForm && !showEditForm && (
          <div className='ml-4 mt-2 border-l-2 pl-3'>
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder='Write a reply...'
              submitText='Post Reply'
              onCancel={() => setShowReplyForm(false)}
              isSubmitting={isSubmittingReply}
            />
          </div>
        )}

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='ml-4 mt-3 space-y-3 border-l-2 pl-3'>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply} // Replies can also be replied to, passing down the top-level onReply
                onEdit={onEdit} // Edit for replies
                onDelete={onDelete} // Delete for replies
                isSubmittingReply={isSubmittingReply}
                isSubmittingEdit={isSubmittingEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
