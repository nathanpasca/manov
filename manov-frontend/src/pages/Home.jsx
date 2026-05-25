import React, { useEffect, useState } from 'react';
import { novelService, userService } from '../services';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 12;

    // Ambil data dari Backend API
    useEffect(() => {
        document.title = 'Manov'; // Set Title Home
        const fetchNovels = async () => {
            try {
                if (page === 0) setLoading(true);

                const res = await novelService.getAll(page * LIMIT, LIMIT);

                if (res.data.length < LIMIT) {
                    setHasMore(false);
                }

                if (page === 0) {
                    setNovels(res.data);
                } else {
                    setNovels((prev) => [...prev, ...res.data]);
                }

                // Jika login, ambil history (cukup sekali di awal)
                if (user && page === 0) {
                    const resHistory = await userService.getHistory();
                    setHistory(resHistory.data);
                }
            } catch (err) {
                console.error('Gagal ambil novel:', err);
                toast.error('Gagal memuat novel. Coba refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchNovels();
    }, [user, page]);

    // Ambil Genres
    const [genres, setGenres] = useState([]);
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await novelService.getGenres();
                setGenres(res.data);
            } catch (err) {
                console.error('Gagal ambil genres:', err);
            }
        };
        fetchGenres();
    }, []);

    // Logic Search & Filter
    const filteredNovels = novels.filter((n) => {
        const matchesSearch = n.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesFilter =
            activeFilter === 'All' ||
            (n.genres && n.genres.some((g) => g.name === activeFilter));
        return matchesSearch && matchesFilter;
    });

    // Ambil novel pertama untuk dijadikan Hero (Featured)
    const featuredNovel = novels.length > 0 ? novels[0] : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24 font-sans text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-100">
            <SEO
                title="Home"
                description="Manov - Your ultimate destination for AI-translated novels. Read unlimited chapters for free."
                url={import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site'}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: 'Manov',
                        url: import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site',
                        description:
                            'Your ultimate destination for AI-translated novels. Read unlimited chapters for free.',
                        potentialAction: {
                            '@type': 'SearchAction',
                            target: {
                                '@type': 'EntryPoint',
                                urlTemplate:
                                    `${import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site'}/?search={search_term_string}`,
                            },
                            'query-input': 'required name=search_term_string',
                        },
                    })}
                </script>
                {novels.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'ItemList',
                            itemListElement: novels
                                .slice(0, 10)
                                .map((novel, index) => ({
                                    '@type': 'ListItem',
                                    position: index + 1,
                                    item: {
                                        '@type': 'Book',
                                        name: novel.title,
                                        url: `${import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site'}/novel/${novel.slug}`,
                                        image: novel.coverUrl,
                                        author: {
                                            '@type': 'Person',
                                            name: novel.author || 'Unknown',
                                        },
                                    },
                                })),
                        })}
                    </script>
                )}
            </Helmet>

            {/* 1. HERO SECTION (Passing Data Real) */}
            <HeroSection featured={featuredNovel} />

            <div className="relative z-10 -mt-8 space-y-8">
                {/* 2. SEARCH BAR */}
                <SearchBar
                    onSearch={setSearchTerm}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    genres={genres}
                />

                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    {/* --- SECTION CONTINUE READING (Muncul jika ada history) --- */}
                    {user && history.length > 0 && !searchTerm && (
                        <div className="mb-10">
                            <div className="mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                                <Clock size={20} className="text-blue-500" />
                                <h2 className="font-serif text-xl font-bold">
                                    Continue Reading
                                </h2>
                            </div>

                            {/* Horizontal Scroll List */}
                            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() =>
                                            navigate(
                                                `/novel/${item.slug}/read/${item.lastReadChapter}`
                                            )
                                        }
                                        className="dark:bg-dark-card group flex w-72 flex-shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-white/10"
                                    >
                                        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                                            <img
                                                src={item.coverUrl}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-bold transition group-hover:text-blue-500">
                                                {item.title}
                                            </h4>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Chapter {item.lastReadChapter}
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-gray-100 p-2 text-gray-400 transition group-hover:bg-blue-500 group-hover:text-white dark:bg-white/5">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Header */}
                    <div className="mb-6 mt-8 flex items-center justify-between">
                        <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-white">
                            Latest Updates
                        </h2>
                        <button className="text-sm font-medium text-blue-500 hover:text-blue-400">
                            View All
                        </button>
                    </div>

                    {/* 3. BENTO GRID (Novel Cards) */}
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid auto-rows-[300px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {filteredNovels.length > 0 ? (
                                filteredNovels.map((novel, index) => (
                                    <NovelCard
                                        key={novel.id}
                                        novel={novel}
                                        priority={index < 4}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400">
                                    No novels found matching your criteria.
                                </div>
                            )}
                        </div>
                    )}

                    {/* LOAD MORE BUTTON */}
                    {hasMore && !loading && !searchTerm && (
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={() => setPage((prev) => prev + 1)}
                                className="rounded-full border border-gray-200 bg-white px-8 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
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
