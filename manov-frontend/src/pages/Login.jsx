import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = 'Login | Manov';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Hit Endpoint Login Backend
            const res = await authService.login(formData);

            // Simpan Token ke Context
            login(res.data.access_token, res.data.user);

            // Redirect sesuai role
            if (res.data.user.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    'Login failed. Check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-24 text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-white">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

            {/* Glass Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl"
            >
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30"
                    >
                        <LogIn className="text-white" size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Sign in to access your library
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"
                    >
                        <AlertCircle size={16} /> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="ml-1 text-xs font-bold uppercase text-gray-500">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white transition-all placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="ml-1 text-xs font-bold uppercase text-gray-500">
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white transition-all placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <span className="cursor-pointer text-blue-400 hover:underline">
                            Create one
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
