import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, activeFilter, onFilterChange, genres = [] }) => {
    return (
        <div className="sticky top-4 z-40 mx-auto w-full max-w-5xl px-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white/90 p-2 backdrop-blur-md md:flex-row dark:border-white/5 dark:bg-[#1c1917]/90">
                {/* Input Area */}
                <div className="relative w-full flex-shrink-0 md:w-64 lg:w-80">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Search novels..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full rounded-lg bg-stone-100 py-2 pl-9 pr-4 text-sm text-stone-800 transition placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 dark:bg-white/5 dark:text-stone-200 dark:focus:ring-stone-600"
                    />
                </div>

                <div className="hidden h-5 w-px bg-stone-200 md:block dark:bg-white/10"></div>

                {/* Filter Chips */}
                <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => onFilterChange('All')}
                        className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                            activeFilter === 'All'
                                ? 'border-stone-800 bg-stone-800 text-white dark:border-stone-200 dark:bg-stone-200 dark:text-stone-900'
                                : 'border-stone-200 bg-transparent text-stone-600 hover:bg-stone-50 dark:border-white/10 dark:text-stone-400 dark:hover:bg-white/5'
                        }`}
                    >
                        All
                    </button>
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => onFilterChange(genre.name)}
                            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                                activeFilter === genre.name
                                    ? 'border-stone-800 bg-stone-800 text-white dark:border-stone-200 dark:bg-stone-200 dark:text-stone-900'
                                    : 'border-stone-200 bg-transparent text-stone-600 hover:bg-stone-50 dark:border-white/10 dark:text-stone-400 dark:hover:bg-white/5'
                            }`}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
