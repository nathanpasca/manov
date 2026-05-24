import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, activeFilter, onFilterChange, genres = [] }) => {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-4 z-40 mx-auto w-full max-w-5xl px-4"
        >
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/80 p-2 shadow-lg backdrop-blur-xl transition-colors duration-300 md:flex-row dark:border-white/10 dark:bg-black/60">
                {/* Input Area */}
                <div className="relative w-full flex-shrink-0 md:w-64 lg:w-80">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search novels..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full rounded-xl bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-800 transition-all placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-white/10 dark:text-gray-200"
                    />
                </div>

                <div className="hidden h-6 w-px bg-gray-300 md:block dark:bg-white/10"></div>

                {/* Filter Chips */}
                <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => onFilterChange('All')}
                        className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                            activeFilter === 'All'
                                ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'border-gray-200 bg-transparent text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                        }`}
                    >
                        All
                    </button>
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => onFilterChange(genre.name)}
                            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                                activeFilter === genre.name
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'border-gray-200 bg-transparent text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                            }`}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default SearchBar;
