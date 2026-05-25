import { Loader } from 'lucide-react';

const LoadingSpinner = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf8f5] dark:bg-[#1c1917]">
            <Loader className="animate-spin text-stone-400" size={32} />
            <p className="text-sm text-stone-400">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
