import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { BookOpen, BookmarkX } from 'lucide-react';
import NovelCard from '../components/NovelCard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Library = () => {
    const { user, logout } = useAuth();
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLibrary = async () => {
        try {
            const res = await api.get('/user/library');
            setLibrary(res.data);
        } catch (err) {
            console.error("Gagal load library", err);
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
            <div className="min-h-screen pt-40 pb-20 flex flex-col items-center justify-center text-center px-4 dark:bg-transparent dark:text-gray-100">
                <BookOpen size={48} className="mb-4 text-gray-400 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                <p className="text-gray-500 mb-6">Please sign in to access your personal library.</p>
                <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition">Sign In</a>
            </div>
        );
    }

    const [searchTerm, setSearchTerm] = useState("");

    const filteredLibrary = library.filter(novel =>
        novel.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 font-sans dark:bg-transparent dark:text-gray-100 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Library</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-blue-500">{library.length}</span> saved novels
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
                            className="w-full pl-4 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* CONTENT GRID */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredLibrary.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
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
                        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <BookmarkX size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {searchTerm ? "No results found" : "Library is Empty"}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs">
                            {searchTerm ? "Try a different keyword." : "Start building your collection by bookmarking novels you like."}
                        </p>
                        {!searchTerm && (
                            <a href="/" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition">
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