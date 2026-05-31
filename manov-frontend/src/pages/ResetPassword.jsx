import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../services';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) setToken(t);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.resetPassword(token, password);
            setSuccess(true);
            toast.success(res.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(
                err.response?.data?.detail || 'Failed to reset password. Try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4 dark:bg-[#1c1917]">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-stone-900 text-white">
                        <BookOpen size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
                        New Password
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Enter your new password below
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <CheckCircle size={32} className="mx-auto mb-2" />
                            <p className="font-medium">Password reset successful!</p>
                            <p className="mt-1">Redirecting to login...</p>
                        </div>
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                        >
                            <ArrowLeft size={14} />
                            Go to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Reset Token
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    placeholder="Paste your reset token"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <Link
                            to="/login"
                            className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                        >
                            <ArrowLeft size={14} />
                            Back to login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
