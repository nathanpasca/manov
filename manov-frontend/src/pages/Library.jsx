import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { BookOpen, BookmarkX } from 'lucide-react';
import NovelCard from '../components/NovelCard';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';

const Library = () => {
    const { user, logout } = useAuth();
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLibrary = async () => {
        try {
            const res = await userService.getLibrary();
            setLibrary(res.data);
        } catch (err) {
            console.error('Gagal load library', err);
            if (err.response && err.response.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLibrary();
    }, [user]);

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-40 text-center dark:bg-transparent dark:text-gray-100">
                <BookOpen size={48} className="mb-4 text-gray-400 opacity-50" />
                <h2 className="mb-2 text-2xl font-bold">Login Required</h2>
                <p className="mb-6 text-gray-500">
                    Please sign in to access your personal library.
                </p>
                <a
                    href="/login"
                    className="rounded-full bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
                >
                    Sign In
                </a>
            </div>
        );
    }

    const [searchTerm, setSearchTerm] = useState('');

    const filteredLibrary = library.filter((novel) =>
        novel.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen px-4 pb-20 pt-24 font-sans transition-colors duration-300 md:px-8 dark:bg-transparent dark:text-gray-100">
            <div className="mx-auto max-w-7xl">
                {/* HEADER SECTION */}
                <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">
                                My Library
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-blue-500">
                                    {library.length}
                                </span>{' '}
                                saved novels
                            </p>
                        </div>
                    </div>

                    {/* Search within Library */}
                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5"
                        />
                    </div>
                </div>

                {/* CONTENT GRID */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[2/3] animate-pulse rounded-xl bg-gray-200 dark:bg-white/5"
                            />
                        ))}
                    </div>
                ) : filteredLibrary.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
                        {filteredLibrary.map((novel, index) => (
                            <motion.div
                                key={novel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="aspect-[2/3]"
                            >
                                <NovelCard novel={novel} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                            <BookmarkX size={32} className="text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                            {searchTerm
                                ? 'No results found'
                                : 'Library is Empty'}
                        </h3>
                        <p className="mb-6 max-w-xs text-sm text-gray-500">
                            {searchTerm
                                ? 'Try a different keyword.'
                                : 'Start building your collection by bookmarking novels you like.'}
                        </p>
                        {!searchTerm && (
                            <a
                                href="/"
                                className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                                Browse Novels
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
