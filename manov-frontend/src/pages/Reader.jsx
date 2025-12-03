import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Settings, ArrowLeft, ArrowRight, Edit, BookOpen, X, Type, Moon, Sun, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartParser } from '../utils/smartParser';
import CommentSection from '../components/CommentSection';

const Reader = () => {
    const { slug, chapterNum } = useParams();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState(null);
    const [parsedBlocks, setParsedBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    const [settings, setSettings] = useState({
        fontSize: 18,
        lineHeight: 1.8,
        theme: 'light',
        fontFamily: 'font-sans',
        textAlign: 'text-left'
    });

    // Close settings when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/novels/${slug}/chapters/${chapterNum}`);
                setChapter(res.data);
                document.title = `${res.data.title} - Chapter ${chapterNum} | Manov`;
                const blocks = smartParser(res.data.content);
                setParsedBlocks(blocks);
            } catch (err) {
                console.error("Gagal ambil chapter:", err);
                toast.error("Gagal memuat chapter. Pastikan chapter tersedia.");
            } finally {
                setLoading(false);
            }
        };
        fetchChapter();
    }, [slug, chapterNum]);

    const handlePrev = () => {
        if (chapter?.prevChapterNum) {
            navigate(`/novel/${slug}/read/${chapter.prevChapterNum}`);
            window.scrollTo(0, 0);
        }
    };

    const handleNext = () => {
        if (chapter?.nextChapterNum) {
            navigate(`/novel/${slug}/read/${chapter.nextChapterNum}`);
            window.scrollTo(0, 0);
        }
    };

    const getThemeColors = () => {
        switch (settings.theme) {
            case 'dark': return 'bg-[#0a0a0a] text-gray-300';
            case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636]';
            default: return 'bg-gray-50 text-gray-800';
        }
    };

    const getNavbarColors = () => {
        switch (settings.theme) {
            case 'dark': return 'bg-black/50 border-white/5 text-gray-200';
            case 'sepia': return 'bg-[#f4ecd8]/80 border-[#eaddc5] text-[#5b4636]';
            default: return 'bg-white/70 border-gray-200/50 text-gray-800';
        }
    };

    if (!chapter && !loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-red-500 gap-4">
            <p className="text-lg font-medium">Chapter not found</p>
            <button onClick={() => navigate(`/novel/${slug}`)} className="text-blue-500 hover:underline">
                Back to Novel
            </button>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-500 ease-in-out ${getThemeColors()} flex flex-col font-sans`}>

            {/* NAVBAR */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 w-full p-4 flex justify-between items-center backdrop-blur-md border-b z-50 transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <button
                        onClick={() => navigate(`/novel/${slug}`)}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-bold truncate opacity-90">
                            {loading ? 'Loading...' : chapter?.title}
                        </h1>
                        <span className="text-xs opacity-60 truncate">
                            Chapter {chapterNum}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => navigate(`/admin/edit/${slug}/${chapterNum}`)}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition opacity-60 hover:opacity-100"
                        title="Edit Chapter"
                    >
                        <Edit size={18} />
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition ${showSettings ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </motion.div>

            {/* SETTINGS PANEL */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        ref={settingsRef}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-20 right-4 w-80 bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-white/10 ring-1 ring-black/5"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-sm uppercase tracking-wider opacity-60">Reader Settings</h3>
                            <button onClick={() => setShowSettings(false)} className="opacity-40 hover:opacity-100 transition">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="space-y-3 mb-8">
                            <label className="text-xs font-medium opacity-60 flex items-center gap-2"><Sun size={12} /> Theme</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                                    className={`h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${settings.theme === 'light'
                                        ? 'ring-2 ring-blue-500 border-transparent bg-gray-50 text-gray-900'
                                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white border border-gray-300 shadow-sm"></div>
                                    <span className="text-[10px] font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, theme: 'sepia' })}
                                    className={`h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${settings.theme === 'sepia'
                                        ? 'ring-2 ring-yellow-600 border-transparent bg-[#f4ecd8] text-[#5b4636]'
                                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-[#eaddc5] shadow-sm"></div>
                                    <span className="text-[10px] font-medium">Sepia</span>
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                                    className={`h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${settings.theme === 'dark'
                                        ? 'ring-2 ring-gray-400 border-transparent bg-gray-900 text-gray-100'
                                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-gray-900 border border-gray-700 shadow-sm"></div>
                                    <span className="text-[10px] font-medium">Dark</span>
                                </button>
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="space-y-3 mb-8">
                            <label className="text-xs font-medium opacity-60 flex items-center gap-2"><Type size={12} /> Typeface</label>
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                <button
                                    onClick={() => setSettings({ ...settings, fontFamily: 'font-sans' })}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${settings.fontFamily === 'font-sans'
                                        ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Sans Serif
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, fontFamily: 'font-serif' })}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${settings.fontFamily === 'font-serif'
                                        ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Serif
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium opacity-60">Size</label>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">{settings.fontSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="14"
                                max="32"
                                step="1"
                                value={settings.fontSize}
                                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] opacity-40 font-medium">
                                <span>Aa</span>
                                <span>Aa</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENT AREA */}
            <div className="flex-grow w-full max-w-3xl mx-auto pt-32 pb-40 px-6 sm:px-8 md:px-12">
                {loading ? (
                    <div className="animate-pulse space-y-8 opacity-20">
                        <div className="h-4 bg-current rounded w-3/4 mx-auto mb-16"></div>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-3 bg-current rounded w-full"></div>
                                <div className="h-3 bg-current rounded w-full"></div>
                                <div className="h-3 bg-current rounded w-5/6"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`${settings.fontFamily} ${settings.textAlign} transition-all duration-300 ease-in-out`}
                        style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
                    >
                        {parsedBlocks.map((block) => (
                            <div key={block.id} className="mb-6">
                                {block.type === 'header' ? (
                                    <h3 className="text-2xl sm:text-3xl font-bold mt-16 mb-8 opacity-90 text-center leading-tight">
                                        {block.content}
                                    </h3>
                                ) : (
                                    <div className="opacity-90">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-6 leading-relaxed" {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-bold opacity-100" {...props} />,
                                                em: ({ node, ...props }) => <span className="italic opacity-90" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-500 underline decoration-blue-300 underline-offset-4 hover:text-blue-600 transition" {...props} />
                                            }}
                                        >
                                            {block.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.article>
                )}

                {/* COMMENTS SECTION */}
                {!loading && chapter && (
                    <div className="mt-16 pt-10 border-t border-gray-200 dark:border-white/10">
                        <CommentSection targetId={chapter.chapterId} type="chapter" />
                    </div>
                )}
            </div>

            {/* FOOTER NAVIGATION */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`fixed bottom-0 w-full p-4 backdrop-blur-md border-t z-40 transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={!chapter?.prevChapterNum}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition font-medium text-sm ${!chapter?.prevChapterNum
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                            }`}
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-40 mb-1">Chapter</span>
                        <span className="text-xl font-black opacity-80 leading-none">{chapterNum}</span>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={!chapter?.nextChapterNum}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition font-medium text-sm ${!chapter?.nextChapterNum
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                            }`}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </motion.div>

        </div >
    );
};

export default Reader;