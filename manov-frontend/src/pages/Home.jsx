import React, { useEffect, useState } from 'react';
import { novelService, userService } from '../services';
import toast from 'react-hot-toast';
import HeroSection from '../components/HeroSection';
import SearchBar from '../components/SearchBar';
import NovelCard from '../components/NovelCard';
import SkeletonCard from '../components/SkeletonCard';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowRight, Flame } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [novels, setNovels] = useState([]);
    const [trending, setTrending] = useState([]);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [statusFilter, setStatusFilter] = useState('All');

    // Read genre from URL query param on mount
    useEffect(() => {
        const genreFromUrl = searchParams.get('genre');
        if (genreFromUrl) {
            setActiveFilter(genreFromUrl);
        }
    }, []);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 12;

    useEffect(() => {
        document.title = 'Manov';
        const fetchNovels = async () => {
            try {
                if (page === 0) setLoading(true);

                const genre = genres.find((g) => g.name === activeFilter);
                const params = {
                    skip: page * LIMIT,
                    limit: LIMIT,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                };
                if (searchTerm.trim().length >= 2) {
                    params.q = searchTerm.trim();
                }
                if (statusFilter !== 'All') {
                    params.status = statusFilter;
                }
                if (genre) {
                    params.genre_id = genre.id;
                }

                const res = await novelService.getAll(params);

                if (res.data.length < LIMIT) {
                    setHasMore(false);
                }

                if (page === 0) {
                    setNovels(res.data);
                } else {
                    setNovels((prev) => [...prev, ...res.data]);
                }

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
    }, [user, page, searchTerm, sortBy, sortOrder, statusFilter, activeFilter]);

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

    // Fetch trending novels
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await novelService.getTrending();
                setTrending(res.data);
            } catch (err) {
                console.error('Gagal ambil trending:', err);
            }
        };
        fetchTrending();
    }, []);

    const featuredNovel = novels.length > 0 ? novels[0] : null;

    return (
        <div className="min-h-screen bg-[#faf8f5] pb-20 pt-24 font-sans text-stone-900 transition-colors duration-300 dark:bg-[#1c1917] dark:text-stone-100">
            <SEO
                title="Home"
                description="Manov — Read translated web novels. Free, unlimited chapters."
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
                            'Read translated web novels. Free, unlimited chapters.',
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

            <HeroSection featured={featuredNovel} />

            {/* Landing context for first-timers */}
            {!user && (
                <div className="mx-auto max-w-2xl px-6 pt-10 text-center">
                    <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                        Manov is a place to read translated web novels.
                        Chapters are translated automatically and available for
                        free. No paywalls, just stories.
                    </p>
                </div>
            )}

            <div className="relative z-10 -mt-6 space-y-8 pt-6">
                <SearchBar
                    onSearch={setSearchTerm}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    genres={genres}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(by, order) => {
                        setSortBy(by);
                        setSortOrder(order);
                        setPage(0);
                    }}
                    statusFilter={statusFilter}
                    onStatusChange={(s) => {
                        setStatusFilter(s);
                        setPage(0);
                    }}
                />

                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    {/* Continue Reading */}
                    {user && history.length > 0 && !searchTerm && (
                        <div className="mb-12">
                            <div className="mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
                                <Clock size={18} className="text-stone-400" />
                                <h2 className="text-lg font-semibold">
                                    Continue Reading
                                </h2>
                            </div>

                            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() =>
                                            navigate(
                                                `/novel/${item.slug}/read/${item.lastReadChapter}`
                                            )
                                        }
                                        className="group flex w-72 flex-shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-stone-100 bg-white p-3 transition hover:border-stone-200 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
                                    >
                                        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                                            <img
                                                src={item.coverUrl}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-semibold transition group-hover:text-stone-600 dark:group-hover:text-stone-300">
                                                {item.title}
                                            </h4>
                                            <p className="mt-1 text-xs text-stone-500">
                                                Chapter {item.lastReadChapter}
                                            </p>
                                            {/* Progress bar */}
                                            {item.progressPercent > 0 && (
                                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-stone-600 dark:bg-stone-400"
                                                        style={{
                                                            width: `${item.progressPercent}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="rounded-full bg-stone-100 p-2 text-stone-400 transition group-hover:bg-stone-200 group-hover:text-stone-600 dark:bg-white/5 dark:group-hover:bg-white/10">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending Section */}
                    {trending.length > 0 && !searchTerm && (
                        <div className="mb-12">
                            <div className="mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
                                <Flame size={18} className="text-orange-500" />
                                <h2 className="text-lg font-semibold">
                                    Trending Now
                                </h2>
                            </div>
                            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
                                {trending.map((novel) => (
                                    <div
                                        key={novel.id}
                                        onClick={() =>
                                            navigate(`/novel/${novel.slug}`)
                                        }
                                        className="w-40 flex-shrink-0 cursor-pointer"
                                    >
                                        <div className="aspect-[2/3] overflow-hidden rounded-xl border border-stone-100 bg-white transition hover:shadow-lg dark:border-white/5 dark:bg-stone-800">
                                            <img
                                                src={novel.coverUrl}
                                                alt={novel.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <h3 className="mt-2 line-clamp-2 text-xs font-semibold text-stone-800 dark:text-stone-100">
                                            {novel.title}
                                        </h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-6 mt-8 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
                            {searchTerm ? 'Search Results' : 'Latest Updates'}
                        </h2>
                        <button className="text-sm font-medium text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                            {novels.length > 0 ? (
                                novels.map((novel, index) => (
                                    <NovelCard
                                        key={novel.id}
                                        novel={novel}
                                        priority={index < 4}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center text-stone-500 dark:text-stone-400">
                                    No novels found matching your criteria.
                                </div>
                            )}
                        </div>
                    )}

                    {hasMore && !loading && !searchTerm && (
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={() => setPage((prev) => prev + 1)}
                                className="rounded-full border border-stone-200 bg-white px-8 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
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
