import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <div className="flex flex-col items-center gap-4">
                <Loader className="animate-spin text-blue-600" size={40} />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
