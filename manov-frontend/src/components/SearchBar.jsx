import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, activeFilter, onFilterChange, genres = [] }) => {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-4 z-40 px-4 w-full max-w-5xl mx-auto"
        >
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 transition-colors duration-300">

                {/* Input Area */}
                <div className="relative w-full md:w-64 lg:w-80 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search novels..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-800 dark:text-gray-200 placeholder:text-gray-500"
                    />
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-white/10 hidden md:block"></div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-1 md:pb-0">
                    <button
                        onClick={() => onFilterChange('All')}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${activeFilter === 'All'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`}
                    >
                        All
                    </button>
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => onFilterChange(genre.name)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${activeFilter === genre.name
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
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