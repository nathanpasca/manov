import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
    Search,
    User,
    LogOut,
    Sun,
    Moon,
    Menu,
    X,
    LayoutDashboard,
} from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // State untuk Theme & Mobile Menu
    const [isDark, setIsDark] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Logic Toggle Theme
    useEffect(() => {
        if (localStorage.getItem('theme') === 'light') {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        } else {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    // Logic Scroll Effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // JANGAN TAMPILKAN NAVBAR DI READER PAGE (Biar immersive)
    if (location.pathname.includes('/read/')) return null;

    // Cek apakah halaman ini butuh navbar transparan (Immersive)
    // User requested to fix overlap, so we disable immersive mode for now to ensure robustness.
    const isImmersive = false;

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${
                    isScrolled || !isImmersive
                        ? 'border-gray-200 bg-white/80 py-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/80'
                        : 'border-transparent bg-transparent py-5'
                }`}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
                    {/* LOGO */}
                    <Link to="/" className="group flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                            Manov<span className="text-blue-500">.</span>
                        </span>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 hover:text-blue-500 dark:text-gray-300' : 'text-white/80 hover:text-white'}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/library"
                            className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 hover:text-blue-500 dark:text-gray-300' : 'text-white/80 hover:text-white'}`}
                        >
                            Library
                        </Link>
                        <Link
                            to="/about"
                            className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 hover:text-blue-500 dark:text-gray-300' : 'text-white/80 hover:text-white'}`}
                        >
                            About
                        </Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`rounded-full p-2 transition ${
                                !isImmersive || isScrolled
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-yellow-400 dark:hover:bg-white/20'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Auth Buttons */}
                        {user ? (
                            <div
                                className={`flex items-center gap-4 border-l pl-4 ${!isImmersive || isScrolled ? 'border-gray-200 dark:border-white/10' : 'border-white/20'}`}
                            >
                                {user.role === 'ADMIN' && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-1 text-sm font-medium text-purple-500 hover:text-purple-400"
                                    >
                                        <LayoutDashboard size={16} /> Admin
                                    </Link>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-xs font-bold text-white shadow-lg">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span
                                        className={`text-sm font-medium ${!isImmersive || isScrolled ? 'dark:text-white' : 'text-white'}`}
                                    >
                                        {user.username}
                                    </span>
                                </div>

                                <button
                                    onClick={logout}
                                    className={`transition ${!isImmersive || isScrolled ? 'text-gray-400 hover:text-red-500' : 'text-white/60 hover:text-red-400'}`}
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`flex items-center gap-3 border-l pl-4 ${!isImmersive || isScrolled ? 'border-gray-200 dark:border-white/10' : 'border-white/20'}`}
                            >
                                <Link
                                    to="/login"
                                    className={`text-sm font-medium hover:text-blue-500 ${!isImmersive || isScrolled ? 'text-gray-600 dark:text-white' : 'text-white'}`}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg shadow-white/10 transition hover:bg-gray-200"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button
                        className={`md:hidden ${!isImmersive || isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </motion.nav>

            {/* SPACER REMOVED - Handled by Page Padding */}

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            }}
                            className="fixed bottom-0 right-0 top-0 z-[70] flex w-[280px] flex-col border-l border-gray-100 bg-white p-6 shadow-2xl md:hidden dark:border-white/10 dark:bg-[#0a0a0a]"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xl font-bold dark:text-white">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                        <BookOpen size={18} />
                                    </div>
                                    Menu
                                </span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-full p-2 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                                >
                                    <BookOpen
                                        size={20}
                                        className="text-blue-500"
                                    />{' '}
                                    Home
                                </Link>
                                <Link
                                    to="/library"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                                >
                                    <BookOpen
                                        size={20}
                                        className="text-purple-500"
                                    />{' '}
                                    My Library
                                </Link>
                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                                >
                                    <BookOpen
                                        size={20}
                                        className="text-green-500"
                                    />{' '}
                                    About
                                </Link>

                                <div className="my-2 h-px bg-gray-100 dark:bg-white/5"></div>

                                <button
                                    onClick={toggleTheme}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                                >
                                    {isDark ? (
                                        <Sun
                                            size={20}
                                            className="text-yellow-500"
                                        />
                                    ) : (
                                        <Moon
                                            size={20}
                                            className="text-gray-500"
                                        />
                                    )}
                                    {isDark ? 'Light Mode' : 'Dark Mode'}
                                </button>

                                <div className="my-2 h-px bg-gray-100 dark:bg-white/5"></div>

                                {user ? (
                                    <>
                                        <div className="mb-2 flex items-center gap-3 px-4 py-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 font-bold text-white shadow-lg">
                                                {user.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold dark:text-white">
                                                    {user.username}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Member
                                                </p>
                                            </div>
                                        </div>

                                        {user.role === 'ADMIN' && (
                                            <Link
                                                to="/admin"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="mb-2 flex items-center gap-3 rounded-xl bg-purple-50 px-4 py-3 font-bold text-purple-600 transition dark:bg-purple-500/10 dark:text-purple-400"
                                            >
                                                <LayoutDashboard size={20} />{' '}
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => {
                                                logout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <LogOut size={20} /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <Link
                                            to="/login"
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="rounded-xl border border-gray-200 px-4 py-3 text-center font-bold transition hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="rounded-xl bg-blue-600 px-4 py-3 text-center font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
