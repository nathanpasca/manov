import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Trash2, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { socialService } from '../services';

const CommentItem = ({
    comment,
    user,
    onDelete,
    onReply,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    onSubmitReply,
    depth = 0,
}) => {
    const isReplying = replyingTo === comment.id;
    const maxDepth = 3;

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-stone-100 pl-4 dark:border-white/5' : ''}`}>
            <div className="group flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-stone-500 to-stone-700 text-xs font-bold text-white shadow-sm">
                    {comment.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-stone-900 dark:text-white">
                                {comment.username}
                            </span>
                            <span className="text-[11px] text-stone-400">
                                {formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    { addSuffix: true }
                                )}
                            </span>
                        </div>

                        {user && user.id === comment.userId && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="p-1 text-stone-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                                title="Delete comment"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                    <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                        {comment.content}
                    </p>

                    {/* Reply button */}
                    {user && depth < maxDepth && (
                        <button
                            onClick={() => {
                                setReplyingTo(isReplying ? null : comment.id);
                                setReplyContent('');
                            }}
                            className="mt-2 text-xs font-medium text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                        >
                            {isReplying ? 'Cancel' : 'Reply'}
                        </button>
                    )}

                    {/* Reply form */}
                    {isReplying && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmitReply(comment.id);
                            }}
                            className="relative mt-3"
                        >
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                autoFocus
                                className="h-20 w-full resize-none rounded-lg border border-stone-200 bg-white p-3 pr-12 text-sm transition focus:outline-none focus:ring-1 focus:ring-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!replyContent.trim()}
                                className="absolute bottom-2.5 right-2.5 rounded-md bg-stone-900 p-1.5 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommentSection = ({ targetId, type = 'novel' }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const LIMIT = 10;

    const endpoint =
        type === 'novel'
            ? `/novels/${targetId}/comments`
            : `/chapters/${targetId}/comments`;

    const fetchComments = async (skip = 0, limit = LIMIT) => {
        try {
            const res = await socialService.getComments(endpoint, skip, limit);
            return res.data;
        } catch (err) {
            console.error('Failed to load comments', err);
            return [];
        }
    };

    const loadInitial = async () => {
        setLoading(true);
        const data = await fetchComments(0, LIMIT);
        setComments(data);
        setHasMore(data.length === LIMIT);
        setLoading(false);
    };

    const handleLoadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        const data = await fetchComments(comments.length, LIMIT);
        if (data.length > 0) {
            setComments((prev) => [...prev, ...data]);
            setHasMore(data.length === LIMIT);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    };

    useEffect(() => {
        if (targetId) loadInitial();
    }, [targetId, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) {
            toast.error('Please login to comment');
            return;
        }

        try {
            setSubmitting(true);
            const res = await socialService.postComment(endpoint, newComment);
            setComments([res.data, ...comments]);
            setNewComment('');
            toast.success('Comment posted!');
        } catch (err) {
            console.error('Failed to post comment', err);
            toast.error('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (parentId) => {
        if (!replyContent.trim()) return;
        if (!user) {
            toast.error('Please login to reply');
            return;
        }

        try {
            const res = await socialService.postComment(
                endpoint,
                replyContent,
                parentId
            );
            setComments([res.data, ...comments]);
            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply posted!');
        } catch (err) {
            console.error('Failed to post reply', err);
            toast.error('Failed to post reply');
        }
    };

    const handleDelete = (commentId) => {
        toast(
            (t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex min-w-[200px] flex-col gap-3 rounded-2xl border border-stone-100 bg-white p-4 text-stone-900 shadow-xl dark:border-white/10 dark:bg-[#1c1917] dark:text-white`}
                >
                    <span className="font-medium">Delete this comment?</span>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                confirmDelete(commentId);
                            }}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ),
            {
                duration: 5000,
                position: 'top-center',
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                },
            }
        );
    };

    const confirmDelete = async (commentId) => {
        try {
            await socialService.deleteComment(commentId);
            setComments(comments.filter((c) => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (err) {
            toast.error('Failed to delete comment');
        }
    };

    // Build comment tree
    const topLevel = comments.filter((c) => !c.parentId);
    const replies = comments.filter((c) => c.parentId);

    return (
        <div className="mx-auto mt-10 max-w-4xl">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold dark:text-white">
                <MessageSquare size={22} className="text-stone-500" />
                Comments{' '}
                <span className="text-sm font-normal text-stone-500">
                    ({comments.length})
                </span>
            </h3>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="relative mb-8">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={
                        user ? 'Write a comment...' : 'Please login to comment'
                    }
                    disabled={!user || submitting}
                    className="h-24 w-full resize-none rounded-xl border border-stone-200 bg-white p-4 pr-14 text-sm transition focus:outline-none focus:ring-1 focus:ring-stone-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={!user || submitting || !newComment.trim()}
                    className="absolute bottom-3 right-3 rounded-lg bg-stone-900 p-2 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {loading ? (
                    <p className="text-center text-stone-500">
                        Loading comments...
                    </p>
                ) : topLevel.length > 0 ? (
                    <>
                        {topLevel.map((comment) => (
                            <div key={comment.id} className="space-y-4">
                                <CommentItem
                                    comment={comment}
                                    user={user}
                                    onDelete={handleDelete}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    onSubmitReply={handleReplySubmit}
                                    depth={0}
                                />
                                {/* Render replies to this comment */}
                                {replies
                                    .filter((r) => r.parentId === comment.id)
                                    .map((reply) => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            user={user}
                                            onDelete={handleDelete}
                                            replyingTo={replyingTo}
                                            setReplyingTo={setReplyingTo}
                                            replyContent={replyContent}
                                            setReplyContent={setReplyContent}
                                            onSubmitReply={handleReplySubmit}
                                            depth={1}
                                        />
                                    ))}
                            </div>
                        ))}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="rounded-full border border-stone-200 bg-white px-6 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
                                >
                                    {loadingMore
                                        ? 'Loading...'
                                        : 'Load more comments'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-10 text-center dark:border-white/10 dark:bg-white/5">
                        <p className="text-stone-500">
                            No comments yet. Be the first to share your
                            thoughts!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
