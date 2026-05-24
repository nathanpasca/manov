import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';

const NovelCard = ({ novel, priority = false }) => {
    return (
        <Link
            to={`/novel/${novel.slug}`}
            className="group relative block h-full w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:z-20 hover:shadow-xl dark:border-white/5 dark:bg-gray-800"
        >
            {/* Background Image (Cover) - Full Fill */}
            <div className="absolute inset-0">
                {novel.coverUrl ? (
                    <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                        <BookOpen size={40} />
                    </div>
                )}
                {/* Gradient Overlay biar teks terbaca */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-300" />
            </div>

            {/* Content Positioned Bottom */}
            <div className="absolute bottom-0 left-0 w-full translate-y-2 p-5 text-white transition-transform duration-300 group-hover:translate-y-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Star size={12} className="fill-blue-400" /> {novel.status}
                </div>

                <h3 className="mb-1 line-clamp-2 text-xl font-bold leading-tight">
                    {novel.title}
                </h3>
                <p className="line-clamp-1 text-sm text-gray-300 opacity-80">
                    {novel.author && novel.author.trim() !== ''
                        ? novel.author
                        : 'Unknown Author'}
                </p>
            </div>
        </Link>
    );
};

export default NovelCard;
