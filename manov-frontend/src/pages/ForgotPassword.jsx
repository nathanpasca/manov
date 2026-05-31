import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../services';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authService.forgotPassword(email);
            setSuccess(true);
            if (res.data.token) {
                setToken(res.data.token);
            }
            toast.success(res.data.message);
        } catch (err) {
            setError(
                err.response?.data?.detail || 'Something went wrong. Try again.'
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
                        Reset Password
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Enter your email and we&apos;ll send you a reset link
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <p className="font-medium">Check your email!</p>
                            <p className="mt-1">
                                If the email exists, a reset link has been sent.
                            </p>
                        </div>
                        {token && (
                            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5">
                                <p className="mb-2 text-xs font-medium text-stone-500">
                                    Dev mode — your reset token:
                                </p>
                                <code className="block break-all rounded bg-white p-2 text-xs text-stone-800 dark:bg-black/30 dark:text-stone-200">
                                    {token}
                                </code>
                                <Link
                                    to={`/reset-password?token=${token}`}
                                    className="mt-3 inline-block text-sm font-medium text-stone-800 underline dark:text-stone-300"
                                >
                                    Continue to reset →
                                </Link>
                            </div>
                        )}
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400"
                        >
                            <ArrowLeft size={14} />
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    placeholder="you@example.com"
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
                                    'Send Reset Link'
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

export default ForgotPassword;
