import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center dark:bg-[#1c1917] dark:text-stone-100">
                    <h1 className="mb-3 text-3xl font-bold">Something went wrong</h1>
                    <p className="mb-6 text-stone-500 dark:text-stone-400">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-full bg-stone-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
