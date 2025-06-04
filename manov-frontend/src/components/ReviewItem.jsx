import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StarRatingDisplay } from "@/components/StarRating"
import { useAuth } from "@/contexts/AuthContext"
import { PenSquare, Trash2, UserCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function ReviewItem({ review, onEdit, onDelete }) {
  const { user } = useAuth()
  const isOwnReview = user && review.user && user.id === review.user.id

  return (
    <Card className='mb-4'>
      <CardHeader className='flex flex-row items-start space-x-3 pb-2'>
        <Avatar>
          <AvatarImage
            src={review.user?.avatarUrl || undefined}
            alt={review.user?.displayName || review.user?.username}
          />
          <AvatarFallback>
            {review.user?.displayName ? (
              review.user.displayName.substring(0, 1).toUpperCase()
            ) : (
              <UserCircle size={20} />
            )}
          </AvatarFallback>
        </Avatar>
        <div className='flex-grow'>
          <div className='flex justify-between items-center'>
            <h4 className='font-semibold'>{review.user?.displayName || review.user?.username || "Anonymous"}</h4>
            {isOwnReview && (
              <div className='space-x-1'>
                <Button variant='ghost' size='icon' onClick={onEdit} aria-label='Edit review'>
                  <PenSquare className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onDelete}
                  aria-label='Delete review'
                  className='text-destructive hover:text-destructive'>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <StarRatingDisplay rating={review.rating} size={4} />
            <span className='text-xs text-muted-foreground'>{new Date(review.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0 pb-4'>
        {review.reviewText ? (
          <p className='text-sm whitespace-pre-line'>{review.reviewText}</p>
        ) : (
          <p className='text-sm text-muted-foreground italic'>No review text provided.</p>
        )}
      </CardContent>
    </Card>
  )
}
