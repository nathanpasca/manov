import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';

const NovelCard = ({ novel }) => {
    return (
        <Link
            to={`/novel/${novel.slug}`}
            className="block group relative w-full h-full overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:z-20 dark:border-white/5"
        >
            {/* Background Image (Cover) - Full Fill */}
            <div className="absolute inset-0">
                {novel.coverUrl ? (
                    <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><BookOpen size={40} /></div>
                )}
                {/* Gradient Overlay biar teks terbaca */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-300" />
            </div>

            {/* Content Positioned Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-5 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <Star size={12} className="fill-blue-400" /> {novel.status}
                </div>

                <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2">{novel.title}</h3>
                <p className="text-sm text-gray-300 line-clamp-1 opacity-80">{novel.author && novel.author.trim() !== "" ? novel.author : "Unknown Author"}</p>
            </div>
        </Link>
    );
};

export default NovelCard;