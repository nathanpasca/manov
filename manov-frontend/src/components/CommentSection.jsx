import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { socialService } from '../services';

const CommentSection = ({ targetId, type = 'novel' }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Determine endpoint based on type
    const endpoint =
        type === 'novel'
            ? `/novels/${targetId}/comments`
            : `/chapters/${targetId}/comments`;

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await socialService.getComments(endpoint);
            setComments(res.data);
        } catch (err) {
            console.error('Failed to load comments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (targetId) fetchComments();
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

            // Add new comment to top
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

    const handleDelete = (commentId) => {
        toast(
            (t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex min-w-[200px] flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-gray-900 shadow-xl dark:border-white/10 dark:bg-gray-800 dark:text-white`}
                >
                    <span className="font-medium">Delete this comment?</span>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
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
            const token = localStorage.getItem('token');
            await socialService.deleteComment(commentId);
            setComments(comments.filter((c) => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (err) {
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div className="mx-auto mt-10 max-w-4xl">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold dark:text-white">
                <MessageSquare size={24} className="text-stone-500" />
                Comments{' '}
                <span className="text-sm font-normal text-gray-500">
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
                    className="h-24 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 pr-14 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                    <p className="text-center text-gray-500">
                        Loading comments...
                    </p>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="group flex gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 font-bold text-white shadow-md">
                                {comment.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {comment.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(
                                                new Date(comment.createdAt),
                                                { addSuffix: true }
                                            )}
                                        </span>
                                    </div>

                                    {/* DELETE BUTTON (Only for owner) */}
                                    {user && user.id === comment.userId && (
                                        <button
                                            onClick={() =>
                                                handleDelete(comment.id)
                                            }
                                            className="p-1 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                                            title="Delete comment"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center dark:border-white/10 dark:bg-white/5">
                        <p className="text-gray-500">
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
