import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="relative h-[300px] w-full animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-gray-200 dark:border-white/5 dark:bg-white/5">
            {/* Image Placeholder */}
            <div className="absolute inset-0 bg-gray-300 dark:bg-white/10"></div>

            {/* Content Placeholder */}
            <div className="absolute bottom-0 left-0 w-full space-y-3 p-5">
                <div className="h-3 w-16 rounded-full bg-gray-400 dark:bg-white/20"></div>
                <div className="h-6 w-3/4 rounded-lg bg-gray-400 dark:bg-white/20"></div>
                <div className="h-4 w-1/2 rounded-lg bg-gray-400 dark:bg-white/20"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
