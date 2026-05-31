import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { novelService, userService } from '../services';
import toast from 'react-hot-toast';
import {
    Settings,
    ArrowLeft,
    ArrowRight,
    Edit,
    X,
    Type,
    Sun,
    Moon,
    Coffee,
    List,
    Lock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

    const [showToc, setShowToc] = useState(false);
    const [novelChapters, setNovelChapters] = useState([]);
    const [tocLoading, setTocLoading] = useState(false);
    const tocRef = useRef(null);
    const [novelId, setNovelId] = useState(null);

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
            if (
                tocRef.current &&
                !tocRef.current.contains(event.target) &&
                showToc
            ) {
                setShowToc(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [showToc]);

    // Persist reader settings
    useEffect(() => {
        localStorage.setItem('manov-reader-settings', JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                setLoading(true);
                const [chapterRes, novelRes] = await Promise.all([
                    novelService.getChapter(slug, chapterNum),
                    novelService.getBySlug(slug),
                ]);
                setChapter(chapterRes.data);
                setNovelId(novelRes.data.id);
                document.title = `${chapterRes.data.title} - Chapter ${chapterNum} | Manov`;
                const blocks = smartParser(chapterRes.data.content);
                setParsedBlocks(blocks);
                setNovelChapters(novelRes.data.chapters || []);
            } catch (err) {
                console.error('Gagal ambil chapter:', err);
                toast.error('Gagal memuat chapter. Pastikan chapter tersedia.');
            } finally {
                setLoading(false);
            }
        };
        fetchChapter();
    }, [slug, chapterNum]);

    // Scroll progress tracking
    const saveProgressTimeout = useRef(null);
    const lastProgress = useRef(0);

    const calculateProgress = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return 0;
        return Math.min(100, Math.round((scrollTop / docHeight) * 100));
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const progress = calculateProgress();
            // Debounce save to backend (every 5 seconds max)
            if (saveProgressTimeout.current) {
                clearTimeout(saveProgressTimeout.current);
            }
            saveProgressTimeout.current = setTimeout(() => {
                if (novelId && Math.abs(progress - lastProgress.current) >= 5) {
                    lastProgress.current = progress;
                    userService
                        .updateProgress({
                            novelId,
                            chapterNum: parseInt(chapterNum),
                            scrollPosition: window.scrollY,
                            progressPercent: progress,
                        })
                        .catch(() => {});
                }
            }, 3000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (saveProgressTimeout.current) {
                clearTimeout(saveProgressTimeout.current);
            }
        };
    }, [novelId, chapterNum, calculateProgress]);

    // Save progress on unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (novelId) {
                const progress = calculateProgress();
                const data = JSON.stringify({
                    novelId,
                    chapterNum: parseInt(chapterNum),
                    scrollPosition: window.scrollY,
                    progressPercent: progress,
                });
                navigator.sendBeacon?.(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user/history/progress`,
                    new Blob([data], { type: 'application/json' })
                );
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [novelId, chapterNum, calculateProgress]);

    // Keyboard navigation: ArrowLeft / ArrowRight, T for TOC, Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 't' || e.key === 'T') setShowToc((prev) => !prev);
            if (e.key === 'Escape') {
                setShowToc(false);
                setShowSettings(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [chapter]);

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
                return 'bg-[#1c1917] text-stone-300';
            case 'sepia':
                return 'bg-[#f4ecd8] text-[#5b4636]';
            default:
                return 'bg-[#faf8f5] text-stone-800';
        }
    };

    const getNavbarColors = () => {
        switch (settings.theme) {
            case 'dark':
                return 'bg-[#1c1917]/80 border-white/5 text-stone-200';
            case 'sepia':
                return 'bg-[#f4ecd8]/80 border-[#eaddc5] text-[#5b4636]';
            default:
                return 'bg-[#faf8f5]/80 border-stone-200/50 text-stone-800';
        }
    };

    if (!chapter && !loading)
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-red-600">
                <p className="text-lg font-medium">Chapter not found</p>
                <button
                    onClick={() => navigate(`/novel/${slug}`)}
                    className="text-stone-600 hover:underline dark:text-stone-400"
                >
                    Back to Novel
                </button>
            </div>
        );

    return (
        <div className={`flex min-h-screen flex-col ${getThemeColors()} transition-colors duration-300`}>
            <SEO
                title={
                    chapter
                        ? `Chapter ${chapter.chapterNum}: ${chapter.title}`
                        : 'Reading...'
                }
                description={`Read Chapter ${chapterNum} of ${chapter ? chapter.novelTitle : 'this novel'} on Manov.`}
            />

            {/* NAVBAR */}
            <div
                className={`fixed top-0 z-50 flex w-full items-center justify-between border-b p-3 backdrop-blur-md transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <button
                        onClick={() => navigate(`/novel/${slug}`)}
                        className="flex-shrink-0 rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-sm font-semibold opacity-90">
                            {loading ? 'Loading...' : chapter?.title}
                        </h1>
                        <span className="truncate text-xs opacity-50">
                            Chapter {chapterNum}
                        </span>
                    </div>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                    <button
                        onClick={() => setShowToc(!showToc)}
                        className={`rounded-full p-2 transition ${showToc ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        title="Table of Contents (T)"
                    >
                        <List size={18} />
                    </button>

                    <button
                        onClick={() =>
                            navigate(`/admin/edit/${slug}/${chapterNum}`)
                        }
                        className="rounded-full p-2 opacity-50 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
                        title="Edit Chapter"
                    >
                        <Edit size={16} />
                    </button>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`rounded-full p-2 transition ${showSettings ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* SETTINGS PANEL */}
            <AnimatePresence>
                {showSettings && (
                    <div
                        ref={settingsRef}
                        className="fixed right-3 top-14 z-50 w-72 rounded-2xl border border-stone-100 bg-white p-5 text-stone-800 shadow-xl dark:border-white/5 dark:bg-[#292524] dark:text-stone-100"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                                Reader Settings
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="opacity-40 transition hover:opacity-100"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Theme Colors */}
                        <div className="mb-6 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium opacity-50">
                                <Sun size={11} /> Theme
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'light',
                                        })
                                    }
                                    className={`flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-medium transition ${
                                        settings.theme === 'light'
                                            ? 'border-stone-800 bg-stone-50 text-stone-900 dark:border-stone-200 dark:bg-stone-700'
                                            : 'border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-3 w-3 rounded-full border border-stone-300 bg-white"></div>
                                    Light
                                </button>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'sepia',
                                        })
                                    }
                                    className={`flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-medium transition ${
                                        settings.theme === 'sepia'
                                            ? 'border-amber-700 bg-[#f4ecd8] text-[#5b4636]'
                                            : 'border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-3 w-3 rounded-full border border-[#eaddc5] bg-[#f4ecd8]"></div>
                                    Sepia
                                </button>
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            theme: 'dark',
                                        })
                                    }
                                    className={`flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-medium transition ${
                                        settings.theme === 'dark'
                                            ? 'border-stone-600 bg-stone-900 text-stone-100'
                                            : 'border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="h-3 w-3 rounded-full border border-stone-600 bg-stone-900"></div>
                                    Dark
                                </button>
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="mb-6 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium opacity-50">
                                <Type size={11} /> Typeface
                            </label>
                            <div className="flex rounded-lg bg-stone-100 p-0.5 dark:bg-white/5">
                                <button
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            fontFamily: 'font-sans',
                                        })
                                    }
                                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                                        settings.fontFamily === 'font-sans'
                                            ? 'bg-white text-stone-900 shadow-sm dark:bg-white/10 dark:text-white'
                                            : 'text-stone-500 dark:text-stone-400'
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
                                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                                        settings.fontFamily === 'font-serif'
                                            ? 'bg-white text-stone-900 shadow-sm dark:bg-white/10 dark:text-white'
                                            : 'text-stone-500 dark:text-stone-400'
                                    }`}
                                >
                                    Serif
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium opacity-50">
                                    Size
                                </label>
                                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">
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
                                className="h-1 w-full cursor-pointer appearance-none rounded bg-stone-200 accent-stone-700 dark:bg-white/10"
                            />
                            <div className="flex justify-between text-[10px] font-medium opacity-30">
                                <span>Aa</span>
                                <span>Aa</span>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOC DRAWER */}
            <AnimatePresence>
                {showToc && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowToc(false)}
                            className="fixed inset-0 z-[55] bg-black/30"
                        />
                        {/* Drawer */}
                        <motion.div
                            ref={tocRef}
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed left-0 top-0 z-[60] h-full w-full sm:w-80 border-r shadow-2xl overflow-hidden flex flex-col ${getThemeColors()} ${settings.theme === 'light' ? 'border-stone-200 bg-[#faf8f5]' : settings.theme === 'sepia' ? 'border-[#eaddc5] bg-[#f4ecd8]' : 'border-white/5 bg-[#1c1917]'}`}
                        >
                            <div className="flex items-center justify-between border-b p-4 backdrop-blur-md"
                                style={{ borderColor: settings.theme === 'sepia' ? '#eaddc5' : undefined }}>
                                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">
                                    Table of Contents
                                </h3>
                                <button
                                    onClick={() => setShowToc(false)}
                                    className="opacity-40 transition hover:opacity-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
                                {novelChapters.length === 0 ? (
                                    <p className="px-3 py-6 text-center text-sm opacity-50">
                                        No chapters available.
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {novelChapters.map((ch) => {
                                            const translation = ch.translations.find(
                                                (t) => t.language === 'EN'
                                            );
                                            const title = translation
                                                ? translation.title
                                                : `Chapter ${ch.chapterNum}`;
                                            const publishedDate = translation?.publishedAt
                                                ? new Date(translation.publishedAt)
                                                : new Date(0);
                                            const isLocked = publishedDate > new Date();
                                            const isCurrent = ch.chapterNum === parseInt(chapterNum);

                                            return (
                                                <div
                                                    key={ch.chapterNum}
                                                    onClick={() => {
                                                        if (!isLocked) {
                                                            navigate(`/novel/${slug}/read/${ch.chapterNum}`);
                                                            setShowToc(false);
                                                            window.scrollTo(0, 0);
                                                        }
                                                    }}
                                                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                                                        isCurrent
                                                            ? settings.theme === 'sepia'
                                                                ? 'bg-[#eaddc5] font-semibold'
                                                                : 'bg-black/5 font-semibold dark:bg-white/10'
                                                            : isLocked
                                                              ? 'cursor-not-allowed opacity-40'
                                                              : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    <span className={`w-8 flex-shrink-0 font-mono text-xs ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                                                        {ch.chapterNum}
                                                    </span>
                                                    <span className="truncate">
                                                        {title}
                                                    </span>
                                                    {isLocked && (
                                                        <Lock size={12} className="ml-auto flex-shrink-0 opacity-40" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CONTENT AREA */}
            <div className="mx-auto w-full max-w-2xl flex-grow px-5 pb-40 pt-24 sm:px-8">
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
                    <article
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
                                                        className="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400"
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
                    </article>
                )}

                {/* COMMENTS SECTION */}
                {!loading && chapter && (
                    <div className="mt-16 border-t border-stone-200 pt-10 dark:border-white/5">
                        <CommentSection
                            targetId={chapter.chapterId}
                            type="chapter"
                        />
                    </div>
                )}
            </div>

            {/* FOOTER NAVIGATION */}
            <div
                className={`fixed bottom-0 z-40 w-full border-t p-3 backdrop-blur-md transition-colors duration-500 ${getNavbarColors()}`}
            >
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={!chapter?.prevChapterNum}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                            !chapter?.prevChapterNum
                                ? 'cursor-not-allowed opacity-30'
                                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/5'
                        }`}
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-30">
                            Chapter
                        </span>
                        <span className="text-lg font-bold leading-none opacity-70">
                            {chapterNum}
                        </span>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={!chapter?.nextChapterNum}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                            !chapter?.nextChapterNum
                                ? 'cursor-not-allowed opacity-30'
                                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/5'
                        }`}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reader;
