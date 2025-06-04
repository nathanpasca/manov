import React, { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils" // Assuming you have this from Shadcn/UI setup

// For Input
export function StarRatingInput({ rating, setRating, maxRating = 5, size = 6, className, disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0)

  const handleSetRating = (rateValue) => {
    if (!disabled) {
      setRating(rateValue)
    }
  }

  const handleSetHoverRating = (rateValue) => {
    if (!disabled) {
      setHoverRating(rateValue)
    }
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[...Array(maxRating)].map((_, index) => {
        const rateValue = index + 1
        return (
          <Star
            key={rateValue}
            className={cn(
              `h-${size} w-${size} transition-colors`,
              rateValue <= (hoverRating || rating)
                ? "text-yellow-500 fill-yellow-400"
                : "text-gray-300 dark:text-gray-600",
              !disabled && "cursor-pointer hover:text-yellow-400"
            )}
            onClick={() => handleSetRating(rateValue)}
            onMouseEnter={() => handleSetHoverRating(rateValue)}
            onMouseLeave={() => handleSetHoverRating(0)}
          />
        )
      })}
    </div>
  )
}

// For Display
export function StarRatingDisplay({ rating, maxRating = 5, size = 4, className, showText = false }) {
  const numericRating = parseFloat(rating) // Convert to number
  const isValidRating = !isNaN(numericRating) && numericRating >= 0 && numericRating <= maxRating

  const fullStars = isValidRating ? Math.floor(numericRating) : 0
  const decimalPart = isValidRating ? numericRating - fullStars : 0
  let halfStar = false
  if (decimalPart >= 0.3 && decimalPart <= 0.7) {
    halfStar = true
  } else if (decimalPart > 0.7) {
    // If decimal is > 0.7, effectively it's closer to the next full star,
    // but StarRatingDisplay usually shows the floor.
    // For simplicity, we'll just use floor. If you want rounding for display:
    // fullStars = Math.round(numericRating); halfStar = false;
  }

  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0)

  return (
    <div className={cn("flex items-center space-x-0.5", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`h-${size} w-${size} text-yellow-500 fill-yellow-400`} />
      ))}
      {halfStar && <Star key='half' className={`h-${size} w-${size} text-yellow-500 fill-yellow-200`} />}{" "}
      {/* Visually distinct half-filled star */}
      {[...Array(Math.max(0, emptyStars))].map((_, i) => (
        <Star key={`empty-${i}`} className={`h-${size} w-${size} text-gray-300 dark:text-gray-600`} />
      ))}
      {showText && (
        <span className={`ml-2 text-sm font-medium text-muted-foreground`}>
          {isValidRating ? numericRating.toFixed(1) : "N/A"} / {maxRating}
        </span>
      )}
    </div>
  )
}
