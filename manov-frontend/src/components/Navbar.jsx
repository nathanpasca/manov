import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
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

    const [isDark, setIsDark] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (location.pathname.includes('/read/')) return null;

    return (
        <>
            <nav
                className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${
                    isScrolled
                        ? 'border-stone-200 bg-white/90 py-3 backdrop-blur-xl dark:border-white/5 dark:bg-[#1c1917]/90'
                        : 'border-transparent bg-transparent py-5'
                }`}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
                    {/* LOGO */}
                    <Link to="/" className="group flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-white transition-transform group-hover:scale-105 dark:bg-stone-700">
                            <BookOpen size={16} />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                            Manov
                        </span>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            to="/"
                            className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                        >
                            Home
                        </Link>
                        <Link
                            to="/library"
                            className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                        >
                            Library
                        </Link>
                        <Link
                            to="/about"
                            className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                        >
                            About
                        </Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/5"
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="flex items-center gap-4 border-l border-stone-200 pl-4 dark:border-white/5">
                                {user.role === 'ADMIN' && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-1 text-sm font-medium text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                                    >
                                        <LayoutDashboard size={14} /> Admin
                                    </Link>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                        {user.username}
                                    </span>
                                </div>

                                <button
                                    onClick={logout}
                                    className="text-stone-400 transition hover:text-red-600"
                                    title="Logout"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 border-l border-stone-200 pl-4 dark:border-white/5">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button
                        className="text-stone-800 dark:text-stone-100 md:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </nav>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <div
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
                        />

                        <div className="fixed bottom-0 right-0 top-0 z-[70] flex w-[280px] flex-col border-l border-stone-100 bg-white p-6 shadow-2xl md:hidden dark:border-white/5 dark:bg-[#1c1917]">
                            <div className="mb-8 flex items-center justify-between">
                                <span className="flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800 text-white">
                                        <BookOpen size={14} />
                                    </div>
                                    Menu
                                </span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5"
                                >
                                    <BookOpen size={18} className="text-stone-400" />{' '}
                                    Home
                                </Link>
                                <Link
                                    to="/library"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5"
                                >
                                    <BookOpen size={18} className="text-stone-400" />{' '}
                                    My Library
                                </Link>
                                <Link
                                    to="/about"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5"
                                >
                                    <BookOpen size={18} className="text-stone-400" />{' '}
                                    About
                                </Link>

                                <div className="my-2 h-px bg-stone-100 dark:bg-white/5"></div>

                                <button
                                    onClick={() => {
                                        toggleTheme();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5"
                                >
                                    {isDark ? (
                                        <Sun size={18} className="text-stone-400" />
                                    ) : (
                                        <Moon size={18} className="text-stone-400" />
                                    )}
                                    {isDark ? 'Light Mode' : 'Dark Mode'}
                                </button>

                                <div className="my-2 h-px bg-stone-100 dark:bg-white/5"></div>

                                {user ? (
                                    <>
                                        <div className="mb-2 flex items-center gap-3 px-4 py-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                                                {user.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                                    {user.username}
                                                </p>
                                            </div>
                                        </div>

                                        {user.role === 'ADMIN' && (
                                            <Link
                                                to="/admin"
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className="mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-white/5"
                                            >
                                                <LayoutDashboard size={18} className="text-stone-400" />{' '}
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => {
                                                logout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <X size={18} /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <div className="mt-2 grid grid-cols-2 gap-3">
                                        <Link
                                            to="/login"
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="rounded-lg border border-stone-200 px-4 py-2.5 text-center text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="rounded-lg bg-stone-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-stone-700"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
