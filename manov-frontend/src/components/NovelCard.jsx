import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';

const NovelCard = ({ novel, priority = false }) => {
    return (
        <Link
            to={`/novel/${novel.slug}`}
            className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl border border-stone-100 bg-white transition-all duration-300 hover:shadow-lg dark:border-white/5 dark:bg-stone-800"
        >
            {/* Background Image (Cover) - Full Fill */}
            <div className="absolute inset-0">
                {novel.coverUrl ? (
                    <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-200 text-stone-400">
                        <BookOpen size={32} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content Positioned Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Star size={10} className="fill-amber-400" /> {novel.status}
                </div>

                <h3 className="mb-0.5 line-clamp-2 text-base font-bold leading-tight">
                    {novel.title}
                </h3>
                <p className="line-clamp-1 text-xs text-stone-300">
                    {novel.author && novel.author.trim() !== ''
                        ? novel.author
                        : 'Unknown Author'}
                </p>
            </div>
        </Link>
    );
};

export default NovelCard;
