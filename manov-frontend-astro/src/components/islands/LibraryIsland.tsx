import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { BookOpen, BookmarkX } from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string;
  status: string;
}

export default function LibraryIsland() {
  const { user, logout } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getLibrary()
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        setLibrary(data);
      })
      .catch((err: any) => {
        console.error('Failed to load library', err);
        if (err.response?.status === 401) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, [user, logout]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-40 text-center dark:bg-transparent dark:text-stone-100">
        <BookOpen size={48} className="mb-4 text-stone-300 opacity-50" />
        <h2 className="mb-2 text-2xl font-bold">Login Required</h2>
        <p className="mb-6 text-stone-500">
          Please sign in to access your personal library.
        </p>
        <a
          href="/login"
          className="rounded-full bg-stone-900 px-6 py-2 font-medium text-white transition hover:bg-stone-700"
        >
          Sign In
        </a>
      </div>
    );
  }

  const filtered = library.filter((novel) =>
    novel.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-stone-100 p-3 text-stone-600 dark:bg-white/5 dark:text-stone-300">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl dark:text-white">
              My Library
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                {library.length}
              </span>{' '}
              saved novels
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search your library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-4 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-stone-300 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-xl bg-stone-200 dark:bg-white/5"
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((novel) => (
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
                    loading="lazy"
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 dark:bg-white/5">
            <BookmarkX size={28} className="text-stone-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-stone-900 dark:text-white">
            {searchTerm ? 'No results found' : 'Library is Empty'}
          </h3>
          <p className="mb-6 max-w-xs text-sm text-stone-500">
            {searchTerm
              ? 'Try a different keyword.'
              : 'Start building your collection by bookmarking novels you like.'}
          </p>
          {!searchTerm && (
            <a
              href="/"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Browse Novels
            </a>
          )}
        </div>
      )}
    </div>
  );
}
