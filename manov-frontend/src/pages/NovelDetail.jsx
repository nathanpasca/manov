import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
    BookOpen, User, Tag, Clock, Star,
    Play, Share2, Bookmark, Search, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import CommentSection from '../components/CommentSection';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const NovelDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [novel, setNovel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chapterSearch, setChapterSearch] = useState("");

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [userRating, setUserRating] = useState(0);

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                // Ambil Data Novel
                const res = await api.get(`/novels/${slug}`);
                setNovel(res.data);
                document.title = `${res.data.title} | Manov`;

                // Jika user login, cek bookmark & rating
                if (user && res.data) {
                    const statusRes = await api.get(`/user/library/check/${res.data.id}`);
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
                await api.delete(`/user/library/${novel.id}`);
                setIsBookmarked(false);
                toast.success("Removed from library");
            } else {
                await api.post(`/user/library/${novel.id}`);
                setIsBookmarked(true);
                toast.success("Added to library");
            }
        } catch (err) {
            toast.error("Failed to update library");
        } finally {
            setBookmarkLoading(false);
        }
    };

    const handleRate = async (score) => {
        if (!user) {
            toast.error("Please login to rate");
            return;
        }
        try {
            const res = await api.post(`/novels/${novel.id}/rate`, { score });
            setUserRating(score);
            setNovel(prev => ({
                ...prev,
                averageRating: res.data.average,
                ratingCount: res.data.count
            }));
            toast.success("Rating submitted!");
        } catch (err) {
            toast.error("Failed to submit rating");
        }
    };

    const handleDeleteNovel = () => {
        toast((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex flex-col gap-3 min-w-[200px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10`}>
                <span className="font-medium">Delete this novel?</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
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
                            confirmDeleteNovel();
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

    const confirmDeleteNovel = async () => {
        try {
            await api.delete(`/admin/novels/${novel.id}`);
            toast.success("Novel deleted");
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete novel");
        }
    };

    // Logic Search Chapter
    const filteredChapters = novel?.chapters.filter(ch => {
        const translation = ch.translations.find(t => t.language === 'EN');
        const title = translation ? translation.title : `Chapter ${ch.chapterNum}`;
        return title.toLowerCase().includes(chapterSearch.toLowerCase()) || ch.chapterNum.toString().includes(chapterSearch);
    }) || [];

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    );

    if (!novel) return <div className="p-10 text-center dark:text-white">Novel not found</div>;

    return (
        <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <SEO
                title={novel.title}
                description={novel.synopsis ? novel.synopsis.slice(0, 160) + "..." : "Read this novel on Manov."}
                image={novel.coverUrl}
                type="book"
                url={`https://manov.nathanpasca.com/novel/${novel.slug}`}
            />
            <Helmet>
                {/* Book Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Book",
                        "name": novel.title,
                        "url": `https://manov.nathanpasca.com/novel/${novel.slug}`,
                        "author": {
                            "@type": "Person",
                            "name": novel.author || "Unknown"
                        },
                        "description": novel.synopsis,
                        "image": novel.coverUrl,
                        "genre": novel.genres?.map(g => g.name).join(", ") || undefined,
                        "inLanguage": "en",
                        "aggregateRating": novel.averageRating ? {
                            "@type": "AggregateRating",
                            "ratingValue": novel.averageRating,
                            "ratingCount": novel.ratingCount || 1,
                            "bestRating": "5",
                            "worstRating": "1"
                        } : undefined
                    })}
                </script>
                {/* Breadcrumb Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://manov.nathanpasca.com"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": novel.title,
                                "item": `https://manov.nathanpasca.com/novel/${novel.slug}`
                            }
                        ]
                    })}
                </script>
            </Helmet>

            {/* --- HERO SECTION (Immersive Background) --- */}
            <div className="relative w-full h-[500px] overflow-hidden">
                {/* Background Blur Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-50"
                    style={{ backgroundImage: `url(${novel.coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-gray-900/60 to-gray-50 dark:to-[#0a0a0a]"></div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col md:flex-row items-end pb-16 gap-8">

                    {/* Floating Cover Art */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-48 md:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/10 flex-shrink-0 -mb-20 md:mb-0 bg-gray-200 dark:bg-gray-800"
                    >
                        {novel.coverUrl ? (
                            <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400"><BookOpen size={40} /></div>
                        )}
                    </motion.div>

                    {/* Info Text */}
                    <div className="flex-1 text-white pb-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap items-center gap-3 mb-3"
                        >
                            <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/30">
                                {novel.status}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-400 font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                <Star size={14} fill="currentColor" />
                                {novel.averageRating ? novel.averageRating.toFixed(1) : "0.0"}
                                <span className="text-gray-400 text-xs ml-1">({novel.ratingCount})</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-2 drop-shadow-lg"
                        >
                            {novel.title}
                        </motion.h1>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg md:text-xl text-gray-200 font-serif italic mb-6 opacity-90"
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
                                onClick={() => navigate(`/novel/${slug}/read/1`)}
                                disabled={novel.chapters.length === 0}
                                className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition shadow-xl ${novel.chapters.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-gray-100 active:scale-95'
                                    }`}
                            >
                                <Play size={20} fill="currentColor" />
                                {novel.chapters.length > 0 ? "Start Reading" : "No Chapters"}
                            </button>
                            <button
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                                className={`backdrop-blur-md border px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${isBookmarked
                                    ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' // Style Active
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20' // Style Inactive
                                    }`}
                            >
                                {isBookmarked ? (
                                    <><Bookmark size={20} fill="currentColor" /> Saved</>
                                ) : (
                                    <><Bookmark size={20} /> Add to Library</>
                                )}
                            </button>
                            <button className="p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 transition">
                                <Share2 size={20} />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="max-w-6xl mx-auto px-6 mt-24 md:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">

                {/* LEFT COLUMN: Synopsis & Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Synopsis Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <BookOpen className="text-blue-500" size={24} /> Synopsis
                        </h3>
                        <div className="prose prose-gray dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                            <p>{novel.synopsis || "No synopsis available yet."}</p>
                        </div>
                    </motion.div>

                    {/* Chapter List Header & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                            Chapters <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">{novel.chapters.length}</span>
                        </h3>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search chapter..."
                                value={chapterSearch}
                                onChange={(e) => setChapterSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64 dark:text-white dark:placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Chapter Grid (Bento Style) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredChapters.length > 0 ? (
                            filteredChapters.map((ch) => {
                                const translation = ch.translations.find(t => t.language === 'EN');
                                const title = translation ? translation.title : `Chapter ${ch.chapterNum}`;
                                const publishedDate = translation?.publishedAt ? new Date(translation.publishedAt) : new Date(0);
                                const isLocked = publishedDate > new Date();

                                return (
                                    <motion.div
                                        key={ch.chapterNum}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        onClick={() => {
                                            if (!isLocked) {
                                                navigate(`/novel/${slug}/read/${ch.chapterNum}`);
                                            }
                                        }}
                                        className={`group relative p-4 rounded-xl border transition-all duration-300 ${isLocked
                                            ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 cursor-not-allowed opacity-70'
                                            : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 cursor-pointer hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-400 group-hover:text-blue-500'
                                                }`}>
                                                CH {ch.chapterNum}
                                            </span>

                                            {isLocked ? (
                                                <span className="text-[10px] bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                    🔒 {publishedDate.toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
                                                    Free
                                                </span>
                                            )}
                                        </div>

                                        <h4 className={`font-medium line-clamp-1 transition-colors ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                            }`}>
                                            {title}
                                        </h4>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-10 text-center text-gray-400 italic">
                                No chapters found.
                            </div>
                        )}
                    </div>

                    {/* COMMENTS SECTION */}
                    <div className="pt-10 border-t border-gray-200 dark:border-white/10">
                        <CommentSection targetId={novel.id} type="novel" />
                    </div>
                </div>

                {/* RIGHT COLUMN: Info Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-white/5 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 sticky top-24">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-white/10 pb-2">Information</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><User size={16} /> Author</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 text-right">{novel.author || "Unknown"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Tag size={16} /> Status</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{novel.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Clock size={16} /> Updated</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {novel.updatedAt ? new Date(novel.updatedAt).toLocaleDateString() : "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><BookOpen size={16} /> Chapters</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{novel.chapters.length}</span>
                            </div>
                        </div>

                        {/* RATING WIDGET */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Rate this Novel</h4>
                            <div className="flex justify-center bg-gray-50 dark:bg-white/5 py-4 rounded-xl">
                                <StarRating rating={userRating} onRate={handleRate} size={28} />
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">
                                {userRating > 0 ? "Thanks for rating!" : "Click to rate"}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Genres</h4>
                            <div className="flex flex-wrap gap-2">
                                {novel.genres && novel.genres.length > 0 ? (
                                    novel.genres.map(genre => (
                                        <span key={genre.id} className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer transition">
                                            {genre.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No genres</span>
                                )}
                            </div>
                        </div>

                        {/* ADMIN ACTIONS */}
                        {user && user.role === 'ADMIN' && (
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Admin Actions</h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/edit-novel/${novel.slug}`)}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                                    >
                                        Edit Metadata
                                    </button>
                                    <button
                                        onClick={handleDeleteNovel}
                                        className="w-full py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition font-medium text-sm"
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