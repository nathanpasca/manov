import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ featured }) => {
    const navigate = useNavigate();

    if (!featured)
        return (
            <div className="h-[400px] animate-pulse bg-stone-200 dark:bg-stone-800"></div>
        );

    return (
        <div className="relative mx-auto h-[55vh] w-full max-w-[1920px] overflow-hidden md:h-[420px]">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featured.coverUrl})` }}
            >
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center gap-6 px-6 md:flex-row md:items-center md:justify-start md:gap-10">
                {/* Floating Cover Art */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hidden h-64 w-44 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-2xl md:block"
                >
                    <img
                        src={featured.coverUrl}
                        alt="Cover"
                        className="h-full w-full object-cover"
                    />
                </motion.div>

                {/* Text Info */}
                <div className="space-y-3 text-white md:flex-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Trending
                        </span>
                        <div className="flex items-center gap-1 text-sm text-amber-400">
                            <Star size={12} fill="currentColor" />
                            <span className="font-medium">
                                {featured.averageRating
                                    ? featured.averageRating.toFixed(1)
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                        {featured.title}
                    </h1>

                    <p className="line-clamp-2 max-w-lg text-sm leading-relaxed text-stone-300 md:text-base">
                        {featured.synopsis || 'No synopsis available.'}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() =>
                                navigate(`/novel/${featured.slug}/read/1`)
                            }
                            disabled={
                                !featured.chapterCount ||
                                featured.chapterCount === 0
                            }
                            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition ${
                                !featured.chapterCount ||
                                featured.chapterCount === 0
                                    ? 'cursor-not-allowed bg-stone-600 text-stone-300'
                                    : 'bg-white text-stone-900 hover:bg-stone-100'
                            }`}
                        >
                            <Play size={14} fill="currentColor" />
                            {!featured.chapterCount ||
                            featured.chapterCount === 0
                                ? 'No Chapters'
                                : 'Read Now'}
                        </button>
                        <button
                            onClick={() => navigate(`/novel/${featured.slug}`)}
                            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
                        >
                            <Info size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
