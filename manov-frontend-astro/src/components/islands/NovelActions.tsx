import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import StarRating from './StarRating';
import { Play, Bookmark, Share2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface NovelActionsProps {
  novelId: string;
  slug: string;
  chapterCount: number;
  averageRating: number;
  ratingCount: number;
}

export default function NovelActions({
  novelId,
  slug,
  chapterCount,
  averageRating,
  ratingCount,
}: NovelActionsProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [currentAvg, setCurrentAvg] = useState(averageRating);
  const [currentCount, setCurrentCount] = useState(ratingCount);

  useEffect(() => {
    if (user) {
      api
        .checkLibraryStatus(novelId)
        .then((res: any) => {
          setIsBookmarked(res.isBookmarked || false);
          if (res.userRating) setUserRating(res.userRating);
        })
        .catch(() => {});

      api
        .getHistory()
        .then((res: any[]) => {
          const item = res.find((h) => h.novelId === novelId);
          if (item) setLastReadChapter(item.lastReadChapter);
        })
        .catch(() => {});
    }
  }, [user, novelId]);

  const handleBookmark = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await api.removeFromLibrary(novelId);
        setIsBookmarked(false);
        toast.success('Removed from library');
      } else {
        await api.addToLibrary(novelId);
        setIsBookmarked(true);
        toast.success('Added to library');
      }
    } catch (err) {
      toast.error('Failed to update library');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleRate = async (score: number) => {
    if (!user) {
      toast.error('Please login to rate');
      return;
    }
    try {
      const res = await api.rateNovel(novelId, score);
      setUserRating(score);
      setCurrentAvg(res.average || averageRating);
      setCurrentCount(res.count || ratingCount);
      toast.success('Rating submitted!');
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/novel/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const targetChapter = lastReadChapter || 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={chapterCount > 0 ? `/novel/${slug}/read/${targetChapter}` : '#'}
        className={`flex items-center gap-2 rounded-full px-8 py-3 font-bold shadow-xl transition ${
          chapterCount === 0
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-white text-black hover:bg-gray-100 active:scale-95'
        }`}
        onClick={(e) => chapterCount === 0 && e.preventDefault()}
      >
        <Play size={20} fill="currentColor" />
        {chapterCount === 0
          ? 'No Chapters'
          : lastReadChapter
            ? `Resume Chapter ${lastReadChapter}`
            : 'Start Reading'}
      </a>

      <button
        onClick={handleBookmark}
        disabled={bookmarkLoading}
        className={`flex items-center gap-2 rounded-full border px-6 py-3 font-medium backdrop-blur-md transition ${
          isBookmarked
            ? 'border-stone-700 bg-stone-800 text-white hover:bg-stone-700'
            : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {isBookmarked ? <Bookmark size={20} fill="currentColor" /> : <Bookmark size={20} />}
        {isBookmarked ? 'Saved' : 'Add to Library'}
      </button>

      <button
        onClick={handleShare}
        className="rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20"
      >
        <Share2 size={20} />
      </button>

      {/* Rating summary */}
      <div className="mt-4 flex w-full items-center gap-2 text-white">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium text-yellow-400 backdrop-blur-sm">
          <Star size={14} fill="currentColor" />
          {currentAvg ? currentAvg.toFixed(1) : '0.0'}
          <span className="ml-1 text-xs text-gray-400">({currentCount})</span>
        </div>
        {user && userRating > 0 && (
          <span className="text-xs text-white/70">Your rating: {userRating}/5</span>
        )}
        {user && (
          <div className="ml-auto">
            <StarRating rating={userRating} onRate={handleRate} size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
