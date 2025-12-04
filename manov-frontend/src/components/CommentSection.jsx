import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';

const CommentSection = ({ targetId, type = 'novel' }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Determine endpoint based on type
    const endpoint = type === 'novel'
        ? `/novels/${targetId}/comments`
        : `/chapters/${targetId}/comments`;

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await api.get(endpoint);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments", err);
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
            toast.error("Please login to comment");
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post(
                endpoint,
                { content: newComment }
            );

            // Add new comment to top
            setComments([res.data, ...comments]);
            setNewComment("");
            toast.success("Comment posted!");
        } catch (err) {
            console.error("Failed to post comment", err);
            toast.error("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (commentId) => {
        toast((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex flex-col gap-3 min-w-[200px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10`}>
                <span className="font-medium">Delete this comment?</span>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmDelete(commentId);
                        }}
                        className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
            style: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
            },
        });
    };

    const confirmDelete = async (commentId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(comments.filter(c => c.id !== commentId));
            toast.success("Comment deleted");
        } catch (err) {
            toast.error("Failed to delete comment");
        }
    };

    return (
        <div className="mt-10 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 dark:text-white">
                <MessageSquare size={24} className="text-blue-500" />
                Comments <span className="text-gray-500 text-sm font-normal">({comments.length})</span>
            </h3>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="mb-8 relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={user ? "Write a comment..." : "Please login to comment"}
                    disabled={!user || submitting}
                    className="w-full p-4 pr-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-24 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={!user || submitting || !newComment.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <Send size={18} />
                </button>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {loading ? (
                    <p className="text-center text-gray-500">Loading comments...</p>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md">
                                {comment.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">{comment.username}</span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* DELETE BUTTON (Only for owner) */}
                                    {user && user.id === comment.userId && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            title="Delete comment"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
