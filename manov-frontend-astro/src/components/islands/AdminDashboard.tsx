import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Novel } from '../../lib/types';
import toast from 'react-hot-toast';
import {
  Plus,
  RefreshCw,
  Edit,
  BookOpen,
  ExternalLink,
  Loader,
  LayoutDashboard,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeSlug, setScrapeSlug] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const fetchNovels = async (currentPage = page) => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * LIMIT;
      const [novelsData, countData] = await Promise.all([
        api.getNovels({ skip, limit: LIMIT }),
        api.getNovelCount(),
      ]);
      setNovels(Array.isArray(novelsData) ? novelsData : novelsData.data || []);
      setTotal(countData.count || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeSlug) return toast.error('Slug is required!');

    setIsScraping(true);
    try {
      await api.triggerScrape({
        url: scrapeUrl || null,
        slug: scrapeSlug,
        title: 'New Novel',
      });
      toast.success(`Scraping started for ${scrapeSlug}.`);
      setScrapeUrl('');
      setScrapeSlug('');
      fetchNovels();
    } catch (err: any) {
      toast.error('Failed to start scrape: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleResume = async (novel: Novel) => {
    if (!confirm(`Continue scraping for "${novel.title}"?`)) return;
    try {
      await api.triggerScrape({
        slug: novel.slug,
        url: null,
        title: novel.title,
      });
      toast.success('Resume signal sent!');
    } catch (err) {
      toast.error('Failed to resume.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24 font-sans text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black text-gray-900 dark:text-white">
              <LayoutDashboard className="text-stone-600" size={32} />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your library and scraper tools
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/add-novel"
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
            >
              <Plus size={20} /> Add Novel
            </a>
            <a
              href="/admin/genres"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <Database size={20} /> Manage Genres
            </a>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-12 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/5"
        >
          <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-stone-500/5 blur-3xl"></div>

          <h2 className="relative z-10 mb-6 flex items-center gap-2 text-xl font-bold">
            <Database className="text-stone-500" size={20} /> Scraper Tool
          </h2>

          <form
            onSubmit={handleScrape}
            className="relative z-10 flex flex-col items-end gap-6 lg:flex-row"
          >
            <div className="w-full flex-1 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Slug (URL Friendly)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. yidu-lvshe"
                  value={scrapeSlug}
                  onChange={(e) => setScrapeSlug(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                />
              </div>
            </div>
            <div className="w-full flex-[2] space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Source URL (Optional for Resume)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.69shuba.com/txt/..."
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isScraping}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 font-bold text-white shadow-lg shadow-gray-200 transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:shadow-none dark:hover:bg-gray-200"
            >
              {isScraping ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              Start Scraper
            </button>
          </form>
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="text-gray-400" size={24} /> Library Management
          </h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-gray-400">
            {total} Novels
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/5"
              ></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {novels.map((novel, index) => (
                <motion.div
                  key={novel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex gap-4">
                    <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 shadow-inner dark:bg-white/10">
                      {novel.coverUrl ? (
                        <img
                          src={novel.coverUrl}
                          alt={novel.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <BookOpen size={20} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10"></div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <h3
                          className="mb-1 truncate text-lg font-bold leading-tight dark:text-white"
                          title={novel.title}
                        >
                          {novel.title}
                        </h3>
                        <p className="mb-2 truncate text-xs text-gray-500 dark:text-gray-400">
                          {novel.slug}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${novel.status === 'ONGOING' ? 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300' : 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300'}`}
                          >
                            {novel.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResume(novel)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-stone-50 hover:text-stone-600 dark:hover:bg-white/5"
                        title="Resume Scraping"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <a
                        href={`/admin/edit-novel/${novel.slug}`}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-stone-50 hover:text-stone-600 dark:hover:bg-white/5"
                        title="Edit Metadata"
                      >
                        <Edit size={18} />
                      </a>
                    </div>

                    <a
                      href={`/novel/${novel.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs font-bold text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
                    >
                      View Page <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
