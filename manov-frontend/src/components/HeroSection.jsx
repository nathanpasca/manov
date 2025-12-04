import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ featured }) => {
    const navigate = useNavigate();

    if (!featured) return <div className="h-[500px] bg-gray-200 animate-pulse rounded-b-[3rem]"></div>;

    return (
        <div className="relative w-full h-[60vh] md:h-[500px] overflow-hidden rounded-b-[3rem] shadow-2xl mx-auto max-w-[1920px]">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featured.coverUrl})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-end md:items-center pb-12 md:pb-0 gap-8">

                {/* Floating Cover Art */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden md:block w-48 h-72 rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 flex-shrink-0"
                >
                    <img
                        src={featured.coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        fetchPriority="high"
                        loading="eager"
                    />
                </motion.div>

                {/* Text Info */}
                <div className="flex-1 space-y-4 md:space-y-6 text-white mb-8 md:mb-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">Trending Now</span>
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                            <Star size={14} fill="currentColor" />
                            <span className="font-semibold">{featured.averageRating ? featured.averageRating.toFixed(1) : "N/A"}</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
                    >
                        {featured.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-300 text-sm md:text-lg max-w-xl line-clamp-3"
                    >
                        {featured.synopsis || "No Synopsis Available."}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-3 pt-2"
                    >
                        <button
                            onClick={() => navigate(`/novel/${featured.slug}/read/1`)}
                            disabled={!featured.chapterCount || featured.chapterCount === 0}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition active:scale-95 ${!featured.chapterCount || featured.chapterCount === 0
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            <Play size={18} fill="currentColor" />
                            {(!featured.chapterCount || featured.chapterCount === 0) ? "No Chapters" : "Read Now"}
                        </button>
                        <button
                            onClick={() => navigate(`/novel/${featured.slug}`)}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition border border-white/10"
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