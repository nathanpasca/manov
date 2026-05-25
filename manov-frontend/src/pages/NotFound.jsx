import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
    React.useEffect(() => {
        document.title = 'Page Not Found | Manov';
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center text-gray-900 dark:bg-[#0a0a0a] dark:text-white">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/10">
                <AlertTriangle size={48} />
            </div>

            <h1 className="mb-2 text-6xl font-black">404</h1>
            <h2 className="mb-4 text-2xl font-bold">Page Not Found</h2>
            <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
                The page you are looking for might have been removed, had its
                name changed, or is temporarily unavailable.
            </p>

            <Link
                to="/"
                className="flex items-center gap-2 rounded-full bg-stone-900 px-8 py-3 font-medium text-white transition hover:bg-stone-700"
            >
                <Home size={20} /> Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
