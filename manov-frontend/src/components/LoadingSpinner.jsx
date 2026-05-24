import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 transition-colors duration-300 dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-4">
                <Loader className="animate-spin text-blue-600" size={40} />
                <p className="animate-pulse text-sm font-medium text-gray-500 dark:text-gray-400">
                    Loading...
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
