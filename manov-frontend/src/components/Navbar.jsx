import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, Search, User, LogOut, Sun, Moon,
    Menu, X, LayoutDashboard
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
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled || !isImmersive
                    ? 'bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-gray-200 dark:border-white/10 py-3 shadow-lg'
                    : 'bg-transparent border-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                            Manov<span className="text-blue-500">.</span>
                        </span>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 dark:text-gray-300 hover:text-blue-500' : 'text-white/80 hover:text-white'}`}>Home</Link>
                        <Link to="/library" className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 dark:text-gray-300 hover:text-blue-500' : 'text-white/80 hover:text-white'}`}>Library</Link>
                        <Link to="/about" className={`text-sm font-medium transition ${!isImmersive || isScrolled ? 'text-gray-600 dark:text-gray-300 hover:text-blue-500' : 'text-white/80 hover:text-white'}`}>About</Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition ${!isImmersive || isScrolled
                                ? 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-white/20'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className={`flex items-center gap-4 pl-4 border-l ${!isImmersive || isScrolled ? 'border-gray-200 dark:border-white/10' : 'border-white/20'}`}>
                                {user.role === 'ADMIN' && (
                                    <Link to="/admin" className="text-sm font-medium text-purple-500 hover:text-purple-400 flex items-center gap-1">
                                        <LayoutDashboard size={16} /> Admin
                                    </Link>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`text-sm font-medium ${!isImmersive || isScrolled ? 'dark:text-white' : 'text-white'}`}>{user.username}</span>
                                </div>

                                <button onClick={logout} className={`transition ${!isImmersive || isScrolled ? 'text-gray-400 hover:text-red-500' : 'text-white/60 hover:text-red-400'}`} title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center gap-3 pl-4 border-l ${!isImmersive || isScrolled ? 'border-gray-200 dark:border-white/10' : 'border-white/20'}`}>
                                <Link to="/login" className={`text-sm font-medium hover:text-blue-500 ${!isImmersive || isScrolled ? 'text-gray-600 dark:text-white' : 'text-white'}`}>Sign In</Link>
                                <Link to="/register" className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition shadow-lg shadow-white/10">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button className={`md:hidden ${!isImmersive || isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`} onClick={() => setMobileMenuOpen(true)}>
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] z-[70] bg-white dark:bg-[#0a0a0a] p-6 md:hidden flex flex-col shadow-2xl border-l border-gray-100 dark:border-white/10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                        <BookOpen size={18} />
                                    </div>
                                    Menu
                                </span>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition dark:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-medium transition flex items-center gap-3">
                                    <BookOpen size={20} className="text-blue-500" /> Home
                                </Link>
                                <Link to="/library" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-medium transition flex items-center gap-3">
                                    <BookOpen size={20} className="text-purple-500" /> My Library
                                </Link>
                                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-medium transition flex items-center gap-3">
                                    <BookOpen size={20} className="text-green-500" /> About
                                </Link>

                                <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>

                                <button
                                    onClick={toggleTheme}
                                    className="px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 font-medium transition flex items-center gap-3 w-full text-left"
                                >
                                    {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-500" />}
                                    {isDark ? "Light Mode" : "Dark Mode"}
                                </button>

                                <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>

                                {user ? (
                                    <>
                                        <div className="px-4 py-3 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold dark:text-white">{user.username}</p>
                                                <p className="text-xs text-gray-500">Member</p>
                                            </div>
                                        </div>

                                        {user.role === 'ADMIN' && (
                                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold transition flex items-center gap-3 mb-2">
                                                <LayoutDashboard size={20} /> Admin Dashboard
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => { logout(); setMobileMenuOpen(false); }}
                                            className="px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-medium transition flex items-center gap-3 w-full text-left"
                                        >
                                            <LogOut size={20} /> Logout
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-center font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                            Sign In
                                        </Link>
                                        <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-blue-600 text-white text-center font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
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