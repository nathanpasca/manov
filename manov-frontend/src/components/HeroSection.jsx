import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ featured }) => {
    const navigate = useNavigate();

    if (!featured)
        return (
            <div className="h-[500px] animate-pulse rounded-b-[3rem] bg-gray-200"></div>
        );

    return (
        <div className="relative mx-auto h-[60vh] w-full max-w-[1920px] overflow-hidden rounded-b-[3rem] shadow-2xl md:h-[500px]">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featured.coverUrl})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center gap-8 px-6 md:flex-row md:items-center md:justify-start">
                {/* Floating Cover Art */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden h-72 w-48 flex-shrink-0 overflow-hidden rounded-xl border-4 border-white/10 shadow-2xl md:block"
                >
                    <img
                        src={featured.coverUrl}
                        alt="Cover"
                        className="h-full w-full object-cover"
                    />
                </motion.div>

                {/* Text Info */}
                <div className="space-y-4 text-white md:mb-0 md:flex-1 md:space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Trending Now
                        </span>
                        <div className="flex items-center gap-1 text-sm text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            <span className="font-semibold">
                                {featured.averageRating
                                    ? featured.averageRating.toFixed(1)
                                    : 'N/A'}
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black leading-tight tracking-tight md:text-6xl"
                    >
                        {featured.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="line-clamp-3 max-w-xl text-sm text-gray-300 md:text-lg"
                    >
                        {featured.synopsis || 'No Synopsis Available.'}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-3 pt-2"
                    >
                        <button
                            onClick={() =>
                                navigate(`/novel/${featured.slug}/read/1`)
                            }
                            disabled={
                                !featured.chapterCount ||
                                featured.chapterCount === 0
                            }
                            className={`flex items-center gap-2 rounded-full px-8 py-3 font-bold transition active:scale-95 ${
                                !featured.chapterCount ||
                                featured.chapterCount === 0
                                    ? 'cursor-not-allowed bg-gray-500 text-gray-300'
                                    : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            <Play size={18} fill="currentColor" />
                            {!featured.chapterCount ||
                            featured.chapterCount === 0
                                ? 'No Chapters'
                                : 'Read Now'}
                        </button>
                        <button
                            onClick={() => navigate(`/novel/${featured.slug}`)}
                            className="rounded-full border border-white/10 bg-white/10 p-3 backdrop-blur transition hover:bg-white/20"
                        >
                            <Info size={20} />
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
