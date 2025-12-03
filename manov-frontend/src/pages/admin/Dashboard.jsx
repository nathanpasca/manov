import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, BookOpen, ExternalLink, Loader, Search, LayoutDashboard, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [novels, setNovels] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Admin Dashboard | Manov";
    }, []);

    // State untuk Scrape Form
    const [scrapeUrl, setScrapeUrl] = useState("");
    const [scrapeSlug, setScrapeSlug] = useState("");
    const [isScraping, setIsScraping] = useState(false);

    // Fetch Data Novel
    const fetchNovels = async () => {
        try {
            const res = await api.get('/novels');
            setNovels(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat library.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNovels();
    }, []);

    // Handler Trigger Scrape
    const handleScrape = async (e) => {
        e.preventDefault();
        if (!scrapeSlug) return toast.error("Slug wajib diisi!");

        setIsScraping(true);
        try {
            // Panggil API Admin Scrape
            await api.post('/admin/scrape', {
                url: scrapeUrl || null, // Kalau kosong, kirim null (Auto Resume)
                slug: scrapeSlug,
                title: "New Novel" // Default title, nanti update sendiri
            });

            toast.success(`Scraping started for ${scrapeSlug}.`);
            setScrapeUrl("");
            setScrapeSlug("");
            fetchNovels(); // Refresh list
        } catch (err) {
            toast.error("Gagal memulai scrape: " + err.message);
        } finally {
            setIsScraping(false);
        }
    };

    // Handler Resume Scrape (Tombol di list)
    const handleResume = async (novel) => {
        if (!confirm(`Lanjutkan scraping untuk "${novel.title}"?`)) return;

        try {
            await api.post('/admin/scrape', {
                slug: novel.slug,
                url: null, // URL Null = Resume Mode
                title: novel.title
            });
            toast.success("Resume signal sent!");
        } catch (err) {
            toast.error("Gagal resume.");
        }
    };

    return (
        <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white p-6 font-sans transition-colors duration-300">

            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <LayoutDashboard className="text-blue-600" size={32} />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your library and scraper tools</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/add-novel')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            <Plus size={20} /> Add Novel
                        </button>
                        <button
                            onClick={() => navigate('/admin/genres')}
                            className="bg-white dark:bg-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition flex items-center gap-2 shadow-sm border border-gray-200 dark:border-white/10"
                        >
                            <Database size={20} /> Manage Genres
                        </button>
                    </div>
                </div>

                {/* --- CARD 1: SCRAPER TOOLS --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 mb-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <Database className="text-blue-500" size={20} /> Scraper Tool
                    </h2>

                    <form onSubmit={handleScrape} className="flex flex-col lg:flex-row gap-6 items-end relative z-10">
                        <div className="flex-1 w-full space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Slug (URL Friendly)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. yidu-lvshe"
                                    value={scrapeSlug}
                                    onChange={e => setScrapeSlug(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex-[2] w-full space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Source URL (Optional for Resume)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="https://www.69shuba.com/txt/..."
                                    value={scrapeUrl}
                                    onChange={e => setScrapeUrl(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isScraping}
                            className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
                        >
                            {isScraping ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Start Scraper
                        </button>
                    </form>
                </motion.div>

                {/* --- CARD 2: NOVEL MANAGEMENT --- */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="text-gray-400" size={24} /> Library Management
                    </h2>
                    <span className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
                        {novels.length} Novels
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-200 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {novels.map((novel, index) => (
                            <motion.div
                                key={novel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition group"
                            >
                                <div className="flex gap-4">
                                    {/* Cover */}
                                    <div className="w-20 h-28 bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden flex-shrink-0 shadow-inner relative">
                                        {novel.coverUrl ? (
                                            <img src={novel.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400"><BookOpen size={20} /></div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight truncate mb-1 dark:text-white" title={novel.title}>{novel.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{novel.slug}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${novel.status === 'ONGOING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'}`}>
                                                    {novel.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResume(novel)}
                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition"
                                            title="Resume Scraping"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/edit-novel/${novel.slug}`)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                                            title="Edit Metadata"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </div>

                                    <a
                                        href={`/novel/${novel.slug}`}
                                        target="_blank"
                                        className="text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition"
                                    >
                                        View Page <ExternalLink size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;