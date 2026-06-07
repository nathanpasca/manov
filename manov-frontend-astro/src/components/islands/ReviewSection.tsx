import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Review } from '../../lib/types';
import StarRating from './StarRating';
import { Star, Send, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSectionProps {
  novelId: string;
}

export default function ReviewSection({ novelId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [score, setScore] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(0);
  const [editContent, setEditContent] = useState('');

  const LIMIT = 10;

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getReviews(novelId, 0, LIMIT);
      setReviews(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (novelId) fetchReviews();
  }, [novelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    if (score < 1) {
      toast.error('Please select a rating');
      return;
    }
    try {
      setSubmitting(true);
      await api.postReview(novelId, score, content);
      setScore(0);
      setContent('');
      toast.success('Review posted!');
      fetchReviews();
    } catch (err) {
      console.error('Failed to post review', err);
      toast.error('Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (reviewId: string) => {
    try {
      await api.updateReview(reviewId, editScore, editContent);
      setEditingId(null);
      toast.success('Review updated');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const userReview = reviews.find((r) => user && r.userId === user.id);

  return (
    <div id="reviews-section" className="mx-auto mt-10 max-w-4xl">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-bold dark:text-white">
        <Star size={22} className="text-yellow-500" />
        Reviews{' '}
        <span className="text-sm font-normal text-stone-500">
          ({reviews.length})
        </span>
      </h3>

      {!userReview && (
        <div className="mb-8 rounded-xl border border-stone-100 bg-white p-5 dark:border-white/5 dark:bg-white/5">
          {!user ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Please sign in to write a review and rate this novel.
              </p>
              <a
                href="/login"
                className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-300">
                Write a review
              </p>
              <div className="mb-4 flex justify-center">
                <StarRating rating={score} onRate={setScore} size={28} />
              </div>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts about this novel..."
                  disabled={submitting}
                  className="h-28 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-4 pr-14 text-sm transition focus:outline-none focus:ring-1 focus:ring-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={submitting || score < 1 || !content.trim()}
                  className="absolute bottom-3 right-3 rounded-lg bg-stone-900 p-2 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-stone-500">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-stone-100 bg-white p-4 dark:border-white/5 dark:bg-white/5"
            >
              {editingId === review.id ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <StarRating
                      rating={editScore}
                      onRate={setEditScore}
                      size={24}
                    />
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="h-24 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100 dark:text-stone-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(review.id)}
                      className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-stone-500 to-stone-700 text-xs font-bold text-white">
                        {review.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-stone-900 dark:text-white">
                        {review.username}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <StarRating rating={review.score} readOnly size={14} />
                  </div>
                  <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                    {review.content}
                  </p>
                  {user && user.id === review.userId && (
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(review.id);
                          setEditScore(review.score);
                          setEditContent(review.content);
                        }}
                        className="flex items-center gap-1 text-xs text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-1 text-xs text-stone-500 transition hover:text-red-500 dark:text-stone-400"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-10 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-stone-500">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </div>
  );
}
