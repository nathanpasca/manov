import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  onRate?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function StarRating({
  rating = 0,
  onRate,
  readOnly = false,
  size = 20,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors duration-200`}
            onClick={() => !readOnly && onRate && onRate(starValue)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
            disabled={readOnly}
          >
            <Star
              size={size}
              className={`${
                starValue <= (hover || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
