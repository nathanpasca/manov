import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { novelService } from '../services';
import toast from 'react-hot-toast';
import {
    Settings,
    ArrowLeft,
    ArrowRight,
    Edit,
    BookOpen,
    X,
    Type,
    Moon,
    Sun,
    Coffee,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartParser } from '../utils/smartParser';
import CommentSection from '../components/CommentSection';
import SEO from '../components/SEO';

const Reader = () => {
    const { slug, chapterNum } = useParams();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState(null);
    const [parsedBlocks, setParsedBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('manov-reader-settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // fall through to defaults
            }
        }
        return {
            fontSize: 18,
            lineHeight: 1.8,
            theme: 'light',
            fontFamily: 'font-sans',
            textAlign: 'text-left',
        };
    });

    // Close settings when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target)
            ) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Persist reader settings
    useEffect(() => {
        localStorage.setItem('manov-reader-settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                setLoading(true);
                const res = await novelService.getChapter(slug, chapterNum);
                setChapter(res.data);
                document.title = `${res.data.title} - Chapter ${chapterNum} | Manov`;
                const blocks = smartParser(res.data.content);
                setParsedBlocks(blocks);
            } catch (err) {
                console.error('Gagal ambil chapter:', err);
                toast.error('Gagal memuat chapter. Pastikan chapter tersedia.');
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
            case 'dark':
                return 'bg-[#0a0a0a] text-gray-300';
            case 'sepia':
                return 'bg-[#f4ecd8] text-[#5b4636]';
            default:
                return 'bg-gray-50 text-gray-800';
        }
    };

    const getNavbarColors = () => {
        switch (settings.theme) {
            case 'dark':
                return 'bg-black/50 border-white/5 text-gray-200';
            case 'sepia':
                return 'bg-[#f4ecd8]/80 border-[#eaddc5] text-[#5b4636]';
            default:
                return 'bg-white/70 border-gray-200/50 text-gray-800';
        }
    };

    if (!chapter && !loading)
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-red-500">
                <p className="text-lg font-medium">Chapter not found</p>
                <button
                    onClick={() => navigate(`/novel/${slug}`)}
                    className="text-blue-500 hover:underline"
                >
                    Back to Novel
                </button>
            </div>
        );

    return (
        <div className="flex min-h-screen flex-col bg-[#f8f9fa] font-serif text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-300">
            <SEO
                title={
                    chapter
                        ? `Chapter ${chapter.chapterNum}: ${chapter.title}`
                        : 'Reading...'
                }
                description={`Read Chapter ${chapterNum} of ${chapter ? chapter.novelTitle : 'this novel'} on Manov.`}
            />

            {/* NAVBAR */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 z-50 flex w-full items-center justify-between border-b p-4 backdrop-blur-md transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <button
                        onClick={() => navigate(`/novel/${slug}`)}
                        className="flex-shrink-0 rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-sm font-bold opacity-90">
                            {loading ? 'Loading...' : chapter?.title}
                        </h1>
                        <span className="truncate text-xs opacity-60">
                            Chapter {chapterNum}
                        </span>
                    </div>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                    <button
                        onClick={() =>
                            navigate(`/admin/edit/${slug}/${chapterNum}`)
                        }
                        className="rounded-full p-2 opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                        title="Edit Chapter"
                    >
                        <Edit size={18} />
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`rounded-full p-2 transition ${showSettings ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
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
                        className="fixed right-4 top-20 z-50 w-80 rounded-2xl border border-gray-100 bg-white p-6 text-gray-800 shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-gray-100"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">
                                Reader Settings
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="opacity-40 transition hover:opacity-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="mb-8 space-y-3">
                            <label className="flex items-center gap-2 text-xs font-medium opacity-60">
                                <Sun size={12} /> Theme
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'light',
                                        })
                                    }
                                    className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                                        settings.theme === 'light'
                                            ? 'border-transparent bg-gray-50 text-gray-900 ring-2 ring-blue-500'
                                            : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-4 w-4 rounded-full border border-gray-300 bg-white shadow-sm"></div>
                                    <span className="text-[10px] font-medium">
                                        Light
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'sepia',
                                        })
                                    }
                                    className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                                        settings.theme === 'sepia'
                                            ? 'border-transparent bg-[#f4ecd8] text-[#5b4636] ring-2 ring-yellow-600'
                                            : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-4 w-4 rounded-full border border-[#eaddc5] bg-[#f4ecd8] shadow-sm"></div>
                                    <span className="text-[10px] font-medium">
                                        Sepia
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'dark',
                                        })
                                    }
                                    className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                                        settings.theme === 'dark'
                                            ? 'border-transparent bg-gray-900 text-gray-100 ring-2 ring-gray-400'
                                            : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-4 w-4 rounded-full border border-gray-700 bg-gray-900 shadow-sm"></div>
                                    <span className="text-[10px] font-medium">
                                        Dark
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="mb-8 space-y-3">
                            <label className="flex items-center gap-2 text-xs font-medium opacity-60">
                                <Type size={12} /> Typeface
                            </label>
                            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            fontFamily: 'font-sans',
                                        })
                                    }
                                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                                        settings.fontFamily === 'font-sans'
                                            ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Sans Serif
                                </button>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            fontFamily: 'font-serif',
                                        })
                                    }
                                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                                        settings.fontFamily === 'font-serif'
                                            ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Serif
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium opacity-60">
                                    Size
                                </label>
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold dark:bg-white/10">
                                    {settings.fontSize}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min="14"
                                max="32"
                                step="1"
                                value={settings.fontSize}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        fontSize: parseInt(e.target.value),
                                    })
                                }
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-white/10"
                            />
                            <div className="flex justify-between text-[10px] font-medium opacity-40">
                                <span>Aa</span>
                                <span>Aa</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENT AREA */}
            <div className="mx-auto w-full max-w-3xl flex-grow px-6 pb-40 pt-32 sm:px-8 md:px-12">
                {loading ? (
                    <div className="animate-pulse space-y-8 opacity-20">
                        <div className="mx-auto mb-16 h-4 w-3/4 rounded bg-current"></div>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-3 w-full rounded bg-current"></div>
                                <div className="h-3 w-full rounded bg-current"></div>
                                <div className="h-3 w-5/6 rounded bg-current"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`${settings.fontFamily} ${settings.textAlign} transition-all duration-300 ease-in-out`}
                        style={{
                            fontSize: `${settings.fontSize}px`,
                            lineHeight: settings.lineHeight,
                        }}
                    >
                        {parsedBlocks.map((block) => (
                            <div key={block.id} className="mb-6">
                                {block.type === 'header' ? (
                                    <h3 className="mb-8 mt-16 text-center text-2xl font-bold leading-tight opacity-90 sm:text-3xl">
                                        {block.content}
                                    </h3>
                                ) : (
                                    <div className="opacity-90">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => (
                                                    <p
                                                        className="mb-6 leading-relaxed"
                                                        {...props}
                                                    />
                                                ),
                                                strong: ({
                                                    node,
                                                    ...props
                                                }) => (
                                                    <span
                                                        className="font-bold opacity-100"
                                                        {...props}
                                                    />
                                                ),
                                                em: ({ node, ...props }) => (
                                                    <span
                                                        className="italic opacity-90"
                                                        {...props}
                                                    />
                                                ),
                                                a: ({ node, ...props }) => (
                                                    <a
                                                        className="text-blue-500 underline decoration-blue-300 underline-offset-4 transition hover:text-blue-600"
                                                        {...props}
                                                    />
                                                ),
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
                    <div className="mt-16 border-t border-gray-200 pt-10 dark:border-white/10">
                        <CommentSection
                            targetId={chapter.chapterId}
                            type="chapter"
                        />
                    </div>
                )}
            </div>

            {/* FOOTER NAVIGATION */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`fixed bottom-0 z-40 w-full border-t p-4 backdrop-blur-md transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={!chapter?.prevChapterNum}
                        className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
                            !chapter?.prevChapterNum
                                ? 'cursor-not-allowed opacity-30'
                                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/10'
                        }`}
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="mb-1 text-xs font-bold uppercase tracking-wider opacity-40">
                            Chapter
                        </span>
                        <span className="text-xl font-black leading-none opacity-80">
                            {chapterNum}
                        </span>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={!chapter?.nextChapterNum}
                        className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
                            !chapter?.nextChapterNum
                                ? 'cursor-not-allowed opacity-30'
                                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/10'
                        }`}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Reader;
