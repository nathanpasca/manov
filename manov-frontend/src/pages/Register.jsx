import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services';
import { motion } from 'framer-motion';
import {
    UserPlus,
    User,
    Mail,
    Lock,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        document.title = 'Register | Manov';
    }, []);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Register User
            const res = await authService.register(formData);

            // 2. Auto Login setelah register sukses
            login(res.data.access_token, res.data.user);

            // 3. Redirect ke Home
            navigate('/');
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    'Registration failed. Try a different email.'
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 m-4 w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl"
            >
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-white/10"
                    >
                        <UserPlus className="text-black" size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Join Manov and start your journey
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Field */}
                    <div className="space-y-1">
                        <label className="ml-1 text-xs font-bold uppercase text-gray-500">
                            Username
                        </label>
                        <div className="relative">
                            <User
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white transition-all placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="johndoe"
                            />
                        </div>
                    </div>

                    {/* Email Field */}
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
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white transition-all placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
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
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white transition-all placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black shadow-lg shadow-white/10 transition-all hover:bg-gray-100 active:scale-95"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-bold text-white hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
