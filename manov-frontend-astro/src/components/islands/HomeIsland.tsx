import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Novel, Genre, HistoryItem } from '../../lib/types';
import SearchBar from './SearchBar';
import toast from 'react-hot-toast';
import { Clock, ArrowRight, Flame } from 'lucide-react';

interface HomeIslandProps {
  initialNovels: Novel[];
  initialTrending: Novel[];
  genres: Genre[];
  initialHasMore: boolean;
}

export default function HomeIsland({
  initialNovels,
  initialTrending,
  genres,
  initialHasMore,
}: HomeIslandProps) {
  const { user } = useAuth();
  const [novels, setNovels] = useState<Novel[]>(initialNovels);
  const [trending] = useState<Novel[]>(initialTrending);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('All');

  const LIMIT = 12;

  // Fetch history when user is available
  useEffect(() => {
    if (user) {
      api.getHistory()
        .then((res) => setHistory(res))
        .catch((err) => console.error('Failed to fetch history:', err));
    }
  }, [user]);

  // Fetch novels when filters/page change
  useEffect(() => {
    // Skip the initial render since we already have initialNovels
    if (page === 0 && searchTerm === '' && activeFilter === 'All' && sortBy === 'updatedAt' && sortOrder === 'desc' && statusFilter === 'All') {
      return;
    }

    const fetchNovels = async () => {
      setLoading(true);
      try {
        const genre = genres.find((g) => g.name === activeFilter);
        const params: Record<string, any> = {
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

        const res = await api.getNovels(params);
        const data = Array.isArray(res) ? res : res.data || [];

        setHasMore(data.length >= LIMIT);

        if (page === 0) {
          setNovels(data);
        } else {
          setNovels((prev) => [...prev, ...data]);
        }
      } catch (err) {
        console.error('Failed to fetch novels:', err);
        toast.error('Failed to load novels. Try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [page, searchTerm, sortBy, sortOrder, statusFilter, activeFilter, genres]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(0);
  };

  const handleSortChange = (by: string, order: string) => {
    setSortBy(by);
    setSortOrder(order);
    setPage(0);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="relative z-10 -mt-6 space-y-8 pt-6">
      <SearchBar
        onSearch={handleSearch}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        genres={genres}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Continue Reading */}
        {user && history.length > 0 && !searchTerm && (
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
              <Clock size={18} className="text-stone-400" />
              <h2 className="text-lg font-semibold">Continue Reading</h2>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
              {history.map((item) => (
                <a
                  key={item.id}
                  href={`/novel/${item.slug}/read/${item.lastReadChapter}`}
                  className="group flex w-72 flex-shrink-0 items-center gap-3 rounded-xl border border-stone-100 bg-white p-3 transition hover:border-stone-200 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
                >
                  <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
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
                    {item.progressPercent > 0 && (
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-stone-600 dark:bg-stone-400"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="rounded-full bg-stone-100 p-2 text-stone-400 transition group-hover:bg-stone-200 group-hover:text-stone-600 dark:bg-white/5 dark:group-hover:bg-white/10">
                    <ArrowRight size={14} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {trending.length > 0 && !searchTerm && (
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
              <Flame size={18} className="text-orange-500" />
              <h2 className="text-lg font-semibold">Trending Now</h2>
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
              {trending.map((novel) => (
                <a
                  key={novel.id}
                  href={`/novel/${novel.slug}`}
                  className="w-40 flex-shrink-0"
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
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Novels Grid */}
        <div className="mb-6 mt-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">
            {searchTerm ? 'Search Results' : 'Latest Updates'}
          </h2>
          <a
            href="/"
            className="text-sm font-medium text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          >
            View All
          </a>
        </div>

        {loading && novels.length === 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {novels.length > 0 ? (
              novels.map((novel, index) => (
                <a
                  key={novel.id}
                  href={`/novel/${novel.slug}`}
                  className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl border border-stone-100 bg-white transition-all duration-300 hover:shadow-lg dark:border-white/5 dark:bg-stone-800"
                >
                  <div className="absolute inset-0">
                    {novel.coverUrl ? (
                      <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-200 text-stone-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {novel.status}
                    </div>
                    <h3 className="mb-0.5 line-clamp-2 text-base font-bold leading-tight">
                      {novel.title}
                    </h3>
                    <p className="line-clamp-1 text-xs text-stone-300">
                      {novel.author && novel.author.trim() !== ''
                        ? novel.author
                        : 'Unknown Author'}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-stone-500 dark:text-stone-400">
                No novels found matching your criteria.
              </div>
            )}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              className="rounded-full border border-stone-200 bg-white px-8 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
            >
              Load More Novels
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
