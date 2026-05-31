import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await userService.getUnreadCount();
            setUnreadCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await userService.getNotifications(0, 20);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try {
            await userService.markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        try {
            await userService.markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    };

    const handleNotificationClick = (n) => {
        if (!n.isRead) {
            userService.markNotificationRead(n.id);
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
        setOpen(false);

        if (n.chapterId && n.novelId) {
            // Navigate to chapter - need slug, fetch it
            // For now, navigate to novel detail
            navigate(`/novel/${n.novelId}`);
        } else if (n.novelId) {
            navigate(`/novel/${n.novelId}`);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#1c1917]"
                >
                    <div className="flex items-center justify-between border-b border-stone-100 p-3 dark:border-white/5">
                        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100"
                        >
                            Notifications
                        </h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                            >
                                <Check size={12} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-stone-400"
                            >
                                Loading...
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`cursor-pointer border-b border-stone-50 p-3 transition last:border-0 hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/5 ${
                                        !n.isRead
                                            ? 'bg-stone-50/50 dark:bg-white/5'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2"
                                    >
                                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-white/10"
                                        >
                                            <BookOpen size={12} className="text-stone-500" />
                                        </div>
                                        <div className="min-w-0 flex-1"
                                        >
                                            <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300"
                                            >
                                                {n.message}
                                            </p>
                                            <span className="mt-1 text-[10px] text-stone-400"
                                            >
                                                {formatDistanceToNow(
                                                    new Date(n.createdAt),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>
                                        {!n.isRead && (
                                            <button
                                                onClick={(e) => handleMarkRead(e, n.id)}
                                                className="flex-shrink-0 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-white/10"
                                                title="Mark as read"
                                            >
                                                <Check size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm text-stone-400"
                            >
                                No notifications yet
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
