import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import HeroSection from '../components/HeroSection';
import SearchBar from '../components/SearchBar';
import NovelCard from '../components/NovelCard';
import SkeletonCard from '../components/SkeletonCard';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]); // State History
    const [novels, setNovels] = useState([]);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 12;

    // Ambil data dari Backend API
    useEffect(() => {
        document.title = "Manov"; // Set Title Home
        const fetchNovels = async () => {
            try {
                if (page === 0) setLoading(true);

                const res = await api.get(`/novels?skip=${page * LIMIT}&limit=${LIMIT}`);

                if (res.data.length < LIMIT) {
                    setHasMore(false);
                }

                if (page === 0) {
                    setNovels(res.data);
                } else {
                    setNovels(prev => [...prev, ...res.data]);
                }

                // Jika login, ambil history (cukup sekali di awal)
                if (user && page === 0) {
                    const resHistory = await api.get('/user/history');
                    setHistory(resHistory.data);
                }
            } catch (err) {
                console.error("Gagal ambil novel:", err);
                toast.error("Gagal memuat novel. Coba refresh.");
            } finally {
                setLoading(false);
            }
        };
        fetchNovels();
        fetchNovels();
    }, [user, page]);

    // Ambil Genres
    const [genres, setGenres] = useState([]);
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await api.get('/genres');
                setGenres(res.data);
            } catch (err) {
                console.error("Gagal ambil genres:", err);
            }
        };
        fetchGenres();
    }, []);

    // Logic Search & Filter
    const filteredNovels = novels.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === "All" || (n.genres && n.genres.some(g => g.name === activeFilter));
        return matchesSearch && matchesFilter;
    });

    // Ambil novel pertama untuk dijadikan Hero (Featured)
    const featuredNovel = novels.length > 0 ? novels[0] : null;

    return (
        <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 pb-20 font-sans transition-colors duration-300">
            <SEO
                title="Home"
                description="Manov - Your ultimate destination for AI-translated novels. Read unlimited chapters for free."
                url="https://manov.nathanpasca.com"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Manov",
                        "url": "https://manov.nathanpasca.com",
                        "description": "Your ultimate destination for AI-translated novels. Read unlimited chapters for free.",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": "https://manov.nathanpasca.com/?search={search_term_string}"
                            },
                            "query-input": "required name=search_term_string"
                        }
                    })}
                </script>
                {novels.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ItemList",
                            "itemListElement": novels.slice(0, 10).map((novel, index) => ({
                                "@type": "ListItem",
                                "position": index + 1,
                                "item": {
                                    "@type": "Book",
                                    "name": novel.title,
                                    "url": `https://manov.nathanpasca.com/novel/${novel.slug}`,
                                    "image": novel.coverUrl,
                                    "author": {
                                        "@type": "Person",
                                        "name": novel.author || "Unknown"
                                    }
                                }
                            }))
                        })}
                    </script>
                )}
            </Helmet>

            {/* 1. HERO SECTION (Passing Data Real) */}
            <HeroSection featured={featuredNovel} />

            <div className="relative -mt-8 z-10 space-y-8">

                {/* 2. SEARCH BAR */}
                <SearchBar
                    onSearch={setSearchTerm}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    genres={genres}
                />

                <div className="max-w-6xl mx-auto px-4 md:px-6">

                    {/* --- SECTION CONTINUE READING (Muncul jika ada history) --- */}
                    {user && history.length > 0 && !searchTerm && (
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
                                <Clock size={20} className="text-blue-500" />
                                <h2 className="text-xl font-bold font-serif">Continue Reading</h2>
                            </div>

                            {/* Horizontal Scroll List */}
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                {history.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(`/novel/${item.slug}/read/${item.lastReadChapter}`)}
                                        className="flex-shrink-0 w-72 bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition cursor-pointer flex gap-3 items-center group"
                                    >
                                        <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                            <img src={item.coverUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate group-hover:text-blue-500 transition">{item.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Chapter {item.lastReadChapter}</p>
                                        </div>
                                        <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6 mt-8">
                        <h2 className="text-2xl font-bold font-serif text-gray-800 dark:text-white">Latest Updates</h2>
                        <button className="text-sm text-blue-500 hover:text-blue-400 font-medium">View All</button>
                    </div>

                    {/* 3. BENTO GRID (Novel Cards) */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]">
                            {filteredNovels.length > 0 ? (
                                filteredNovels.map((novel, index) => (
                                    <NovelCard
                                        key={novel.id}
                                        novel={novel}
                                        priority={index < 4}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">
                                    No novels found matching your criteria.
                                </div>
                            )}
                        </div>
                    )}

                    {/* LOAD MORE BUTTON */}
                    {hasMore && !loading && !searchTerm && (
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                className="px-8 py-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition shadow-sm"
                            >
                                Load More Novels
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Home;