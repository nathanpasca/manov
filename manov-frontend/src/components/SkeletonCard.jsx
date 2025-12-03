import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="relative w-full h-[300px] rounded-2xl bg-gray-200 dark:bg-white/5 overflow-hidden animate-pulse border border-gray-100 dark:border-white/5">
            {/* Image Placeholder */}
            <div className="absolute inset-0 bg-gray-300 dark:bg-white/10"></div>

            {/* Content Placeholder */}
            <div className="absolute bottom-0 left-0 w-full p-5 space-y-3">
                <div className="h-3 w-16 bg-gray-400 dark:bg-white/20 rounded-full"></div>
                <div className="h-6 w-3/4 bg-gray-400 dark:bg-white/20 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-gray-400 dark:bg-white/20 rounded-lg"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
