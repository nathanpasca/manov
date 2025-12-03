import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
    React.useEffect(() => {
        document.title = "Page Not Found | Manov";
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white p-6 text-center">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                <AlertTriangle size={48} />
            </div>

            <h1 className="text-6xl font-black mb-2">404</h1>
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <Link
                to="/"
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
            >
                <Home size={20} /> Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
