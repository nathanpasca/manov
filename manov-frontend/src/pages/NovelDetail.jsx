import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { novelService, userService, adminService, socialService } from '../services';
import { motion } from 'framer-motion';
import {
    BookOpen,
    User,
    Tag,
    Clock,
    Star,
    Play,
    Share2,
    Bookmark,
    Search,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import CommentSection from '../components/CommentSection';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const SITE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site';

const NovelDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [novel, setNovel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chapterSearch, setChapterSearch] = useState('');

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [userRating, setUserRating] = useState(0);

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                // Ambil Data Novel
                const res = await novelService.getBySlug(slug);
                setNovel(res.data);
                document.title = `${res.data.title} | Manov`;

                // Jika user login, cek bookmark & rating
                if (user && res.data) {
                    const statusRes = await userService.checkLibraryStatus(res.data.id);
                    setIsBookmarked(statusRes.data.isBookmarked);

                    // Set User Rating dari backend
                    if (statusRes.data.userRating) {
                        setUserRating(statusRes.data.userRating);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [slug, user]);

    const handleBookmark = async () => {
        if (!user) return navigate('/login');
        if (!novel) return;

        setBookmarkLoading(true);
        try {
            if (isBookmarked) {
                await userService.removeFromLibrary(novel.id);
                setIsBookmarked(false);
                toast.success('Removed from library');
            } else {
                await userService.addToLibrary(novel.id);
                setIsBookmarked(true);
                toast.success('Added to library');
            }
        } catch (err) {
            toast.error('Failed to update library');
        } finally {
            setBookmarkLoading(false);
        }
    };

    const handleRate = async (score) => {
        if (!user) {
            toast.error('Please login to rate');
            return;
        }
        try {
            const res = await socialService.rateNovel(novel.id, score);
            setUserRating(score);
            setNovel((prev) => ({
                ...prev,
                averageRating: res.data.average,
                ratingCount: res.data.count,
            }));
            toast.success('Rating submitted!');
        } catch (err) {
            toast.error('Failed to submit rating');
        }
    };

    const handleDeleteNovel = () => {
        toast(
            (t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex min-w-[200px] flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-gray-900 shadow-xl dark:border-white/10 dark:bg-gray-800 dark:text-white`}
                >
                    <span className="font-medium">Delete this novel?</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        This action cannot be undone.
                    </p>
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
                                confirmDeleteNovel();
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

    const confirmDeleteNovel = async () => {
        try {
            await adminService.deleteNovel(novel.id);
            toast.success('Novel deleted');
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete novel');
        }
    };

    // Logic Search Chapter
    const filteredChapters =
        novel?.chapters.filter((ch) => {
            const translation = ch.translations.find(
                (t) => t.language === 'EN'
            );
            const title = translation
                ? translation.title
                : `Chapter ${ch.chapterNum}`;
            return (
                title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
                ch.chapterNum.toString().includes(chapterSearch)
            );
        }) || [];

    if (loading)
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-transparent">
                <div className="flex animate-pulse flex-col items-center">
                    <div className="mb-4 h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                    <div className="h-4 w-32 rounded bg-gray-300 dark:bg-gray-700"></div>
                </div>
            </div>
        );

    if (!novel)
        return (
            <div className="p-10 text-center dark:text-white">
                Novel not found
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 font-sans text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-100">
            <SEO
                title={novel.title}
                description={
                    novel.synopsis
                        ? novel.synopsis.slice(0, 160) + '...'
                        : 'Read this novel on Manov.'
                }
                image={novel.coverUrl}
                type="book"
                url={`${SITE_URL}/novel/${novel.slug}`}
            />
            <Helmet>
                {/* Book Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Book',
                        name: novel.title,
                        url: `${SITE_URL}/novel/${novel.slug}`,
                        author: {
                            '@type': 'Person',
                            name: novel.author || 'Unknown',
                        },
                        description: novel.synopsis,
                        image: novel.coverUrl,
                        genre:
                            novel.genres?.map((g) => g.name).join(', ') ||
                            undefined,
                        inLanguage: 'en',
                        aggregateRating: novel.averageRating
                            ? {
                                  '@type': 'AggregateRating',
                                  ratingValue: novel.averageRating,
                                  ratingCount: novel.ratingCount || 1,
                                  bestRating: '5',
                                  worstRating: '1',
                              }
                            : undefined,
                    })}
                </script>
                {/* Breadcrumb Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            {
                                '@type': 'ListItem',
                                position: 1,
                                name: 'Home',
                                item: SITE_URL,
                            },
                            {
                                '@type': 'ListItem',
                                position: 2,
                                name: novel.title,
                                item: `${SITE_URL}/novel/${novel.slug}`,
                            },
                        ],
                    })}
                </script>
            </Helmet>

            {/* --- HERO SECTION (Immersive Background) --- */}
            <div className="relative h-[500px] w-full overflow-hidden">
                {/* Background Blur Image */}
                <div
                    className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-xl"
                    style={{ backgroundImage: `url(${novel.coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-gray-900/60 to-gray-50 dark:to-[#0a0a0a]"></div>

                {/* Hero Content */}
                <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-end gap-8 px-6 pb-16 md:flex-row">
                    {/* Floating Cover Art */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="-mb-20 aspect-[2/3] w-48 flex-shrink-0 overflow-hidden rounded-xl border-4 border-white bg-gray-200 shadow-2xl md:mb-0 md:w-64 dark:border-white/10 dark:bg-gray-800"
                    >
                        {novel.coverUrl ? (
                            <img
                                src={novel.coverUrl}
                                alt={novel.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <BookOpen size={40} />
                            </div>
                        )}
                    </motion.div>

                    {/* Info Text */}
                    <div className="flex-1 pb-4 text-white">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-3 flex flex-wrap items-center gap-3"
                        >
                            <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                {novel.status}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium text-yellow-400 backdrop-blur-sm">
                                <Star size={14} fill="currentColor" />
                                {novel.averageRating
                                    ? novel.averageRating.toFixed(1)
                                    : '0.0'}
                                <span className="ml-1 text-xs text-gray-400">
                                    ({novel.ratingCount})
                                </span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-2 text-4xl font-black leading-tight drop-shadow-lg md:text-5xl lg:text-6xl"
                        >
                            {novel.title}
                        </motion.h1>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-6 font-serif text-lg italic text-gray-200 opacity-90 md:text-xl"
                        >
                            {novel.originalTitle} • {novel.author}
                        </motion.h2>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap gap-3"
                        >
                            <button
                                onClick={() =>
                                    navigate(`/novel/${slug}/read/1`)
                                }
                                disabled={novel.chapters.length === 0}
                                className={`flex items-center gap-2 rounded-full px-8 py-3 font-bold shadow-xl transition ${
                                    novel.chapters.length === 0
                                        ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                                        : 'bg-white text-black hover:bg-gray-100 active:scale-95'
                                }`}
                            >
                                <Play size={20} fill="currentColor" />
                                {novel.chapters.length > 0
                                    ? 'Start Reading'
                                    : 'No Chapters'}
                            </button>
                            <button
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                                className={`flex items-center gap-2 rounded-full border px-6 py-3 font-medium backdrop-blur-md transition ${
                                    isBookmarked
                                        ? 'border-stone-700 bg-stone-800 text-white hover:bg-stone-700' // Style Active
                                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20' // Style Inactive
                                }`}
                            >
                                {isBookmarked ? (
                                    <>
                                        <Bookmark
                                            size={20}
                                            fill="currentColor"
                                        />{' '}
                                        Saved
                                    </>
                                ) : (
                                    <>
                                        <Bookmark size={20} /> Add to Library
                                    </>
                                )}
                            </button>
                            <button className="rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20">
                                <Share2 size={20} />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="mx-auto mt-24 grid max-w-6xl grid-cols-1 gap-10 px-6 pb-20 md:mt-12 lg:grid-cols-3">
                {/* LEFT COLUMN: Synopsis & Details */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Synopsis Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/5"
                    >
                        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold dark:text-white">
                            <BookOpen className="text-stone-500" size={24} />{' '}
                            Synopsis
                        </h3>
                        <div className="prose prose-gray dark:prose-invert max-w-none leading-relaxed text-gray-600 dark:text-gray-300">
                            {novel.synopsis ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => (
                                            <p
                                                className="mb-4 leading-relaxed"
                                                {...props}
                                            />
                                        ),
                                        strong: ({ node, ...props }) => (
                                            <span
                                                className="font-bold"
                                                {...props}
                                            />
                                        ),
                                        em: ({ node, ...props }) => (
                                            <span
                                                className="italic"
                                                {...props}
                                            />
                                        ),
                                        a: ({ node, ...props }) => (
                                            <a
                                                className="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400"
                                                {...props}
                                            />
                                        ),
                                    }}
                                >
                                    {novel.synopsis}
                                </ReactMarkdown>
                            ) : (
                                <p>No synopsis available yet.</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Chapter List Header & Search */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <h3 className="flex items-center gap-2 text-xl font-bold dark:text-white">
                            Chapters{' '}
                            <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                {novel.chapters.length}
                            </span>
                        </h3>

                        {/* Search Input */}
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search chapter..."
                                value={chapterSearch}
                                onChange={(e) =>
                                    setChapterSearch(e.target.value)
                                }
                                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:w-64 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Chapter Grid (Bento Style) */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {filteredChapters.length > 0 ? (
                            filteredChapters.map((ch) => {
                                const translation = ch.translations.find(
                                    (t) => t.language === 'EN'
                                );
                                const title = translation
                                    ? translation.title
                                    : `Chapter ${ch.chapterNum}`;
                                const publishedDate = translation?.publishedAt
                                    ? new Date(translation.publishedAt)
                                    : new Date(0);
                                const isLocked = publishedDate > new Date();

                                return (
                                    <motion.div
                                        key={ch.chapterNum}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        onClick={() => {
                                            if (!isLocked) {
                                                navigate(
                                                    `/novel/${slug}/read/${ch.chapterNum}`
                                                );
                                            }
                                        }}
                                        className={`group relative rounded-xl border p-4 transition-all duration-300 ${
                                            isLocked
                                                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70 dark:border-white/5 dark:bg-white/5'
                                                : 'cursor-pointer border-gray-100 bg-white hover:border-stone-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="mb-1 flex items-start justify-between">
                                            <span
                                                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                                                    isLocked
                                                        ? 'text-gray-400 dark:text-gray-500'
                                                        : 'text-gray-400 group-hover:text-stone-600 dark:text-gray-400'
                                                }`}
                                            >
                                                CH {ch.chapterNum}
                                            </span>

                                            {isLocked ? (
                                                <span className="flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                                                    🔒{' '}
                                                    {publishedDate.toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-white/5 dark:text-stone-400">
                                                    Free
                                                </span>
                                            )}
                                        </div>

                                        <h4
                                            className={`line-clamp-1 font-medium transition-colors ${
                                                isLocked
                                                    ? 'text-gray-400 dark:text-gray-500'
                                                    : 'text-gray-800 group-hover:text-stone-600 dark:text-gray-200 dark:group-hover:text-stone-400'
                                            }`}
                                        >
                                            {title}
                                        </h4>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-10 text-center italic text-gray-400">
                                No chapters found.
                            </div>
                        )}
                    </div>

                    {/* COMMENTS SECTION */}
                    <div className="border-t border-gray-200 pt-10 dark:border-white/10">
                        <CommentSection targetId={novel.id} type="novel" />
                    </div>
                </div>

                {/* RIGHT COLUMN: Info Sidebar */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <h3 className="mb-6 border-b border-gray-100 pb-2 font-bold text-gray-900 dark:border-white/10 dark:text-white">
                            Information
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <User size={16} /> Author
                                </span>
                                <span className="text-right text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {novel.author || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Tag size={16} /> Status
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {novel.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock size={16} /> Updated
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {novel.updatedAt
                                        ? new Date(
                                              novel.updatedAt
                                          ).toLocaleDateString()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <BookOpen size={16} /> Chapters
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {novel.chapters.length}
                                </span>
                            </div>
                        </div>

                        {/* RATING WIDGET */}
                        <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10">
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                Rate this Novel
                            </h4>
                            <div className="flex justify-center rounded-xl bg-gray-50 py-4 dark:bg-white/5">
                                <StarRating
                                    rating={userRating}
                                    onRate={handleRate}
                                    size={28}
                                />
                            </div>
                            <p className="mt-2 text-center text-xs text-gray-400">
                                {userRating > 0
                                    ? 'Thanks for rating!'
                                    : 'Click to rate'}
                            </p>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10">
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                Genres
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {novel.genres && novel.genres.length > 0 ? (
                                    novel.genres.map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                                        >
                                            {genre.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs italic text-gray-400">
                                        No genres
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ADMIN ACTIONS */}
                        {user && user.role === 'ADMIN' && (
                            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10">
                                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Admin Actions
                                </h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/admin/edit-novel/${novel.slug}`
                                            )
                                        }
                                        className="w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                                    >
                                        Edit Metadata
                                    </button>
                                    <button
                                        onClick={handleDeleteNovel}
                                        className="w-full rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white dark:text-red-400"
                                    >
                                        Delete Novel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NovelDetail;
