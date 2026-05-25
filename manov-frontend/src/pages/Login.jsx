import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authService.login(formData);
            login(res.data.access_token, res.data.user);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail || 'Login failed. Please try again.'
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
                        Welcome back
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Sign in to continue reading
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 transition focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
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
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-stone-500">
                    Don&apos;t have an account?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-600 dark:text-stone-300"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
