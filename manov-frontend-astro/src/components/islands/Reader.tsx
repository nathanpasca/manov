import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Settings,
  ArrowLeft,
  ArrowRight,
  Edit,
  X,
  Type,
  Sun,
  List,
  Lock,
} from 'lucide-react';
import { renderReaderMarkdown } from '../../lib/renderMarkdown';
import { smartParser } from '../../lib/smartParser';
import CommentSection from './CommentSection';
import type { Chapter } from '../../lib/types';

interface ReaderProps {
  slug: string;
  chapterNum: number;
  chapter: {
    id: string;
    chapterId?: string;
    chapterNum: number;
    title: string;
    content: string;
    novelTitle: string;
    novelAuthor: string;
    coverUrl: string;
    prevChapterNum: number | null;
    nextChapterNum: number | null;
  };
  novelChapters: Chapter[];
  novelId: string;
}

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'sepia' | 'dark';
  fontFamily: 'font-sans' | 'font-serif';
  textAlign: 'text-left' | 'text-justify';
}

interface ReadingHistory {
  novelId: string;
  chapterNum: number;
  lastReadBlockIndex: number | null;
  blockOffsetPercent: number;
  scrollPosition: number | null;
  progressPercent: number;
  updatedAt?: string;
}

export default function Reader({
  slug,
  chapterNum,
  chapter,
  novelChapters,
  novelId,
}: ReaderProps) {
  const [parsedBlocks] = useState(() => smartParser(chapter.content));
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [showToc, setShowToc] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastReadingPos = useRef<{ blockIndex: number; blockOffsetPercent: number } | null>(null);
  const setBlockRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      blockRefs.current[index] = el;
    },
    []
  );

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    if (typeof window === 'undefined') {
      return {
        fontSize: 18,
        lineHeight: 1.8,
        theme: 'light',
        fontFamily: 'font-sans',
        textAlign: 'text-left',
      };
    }
    const saved = localStorage.getItem('manov-reader-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through
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

  // Persist settings
  useEffect(() => {
    localStorage.setItem('manov-reader-settings', JSON.stringify(settings));
  }, [settings]);

  // Close panels on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
      if (
        tocRef.current &&
        !tocRef.current.contains(event.target as Node) &&
        showToc
      ) {
        setShowToc(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToc]);

  // Scroll progress tracking
  const saveProgressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgress = useRef(0);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }, []);

  const getCurrentReadingPosition = useCallback(() => {
    if (blockRefs.current.length === 0) return null;
    const viewportTop = window.scrollY + 80; // small buffer below navbar

    for (let i = 0; i < blockRefs.current.length; i++) {
      const el = blockRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const blockTop = rect.top + window.scrollY;
      const blockHeight = rect.height;
      if (blockHeight <= 0) continue;

      if (blockTop <= viewportTop && blockTop + blockHeight > viewportTop) {
        const offset = Math.min(
          100,
          Math.max(0, Math.round(((viewportTop - blockTop) / blockHeight) * 100))
        );
        return { blockIndex: i, blockOffsetPercent: offset };
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const progress = calculateProgress();
      if (saveProgressTimeout.current) {
        clearTimeout(saveProgressTimeout.current);
      }
      saveProgressTimeout.current = setTimeout(() => {
        if (novelId && Math.abs(progress - lastProgress.current) >= 5) {
          lastProgress.current = progress;
          const readingPos = getCurrentReadingPosition();
          if (readingPos) lastReadingPos.current = readingPos;
          api
            .updateProgress({
              novelId,
              chapterNum,
              lastReadBlockIndex: readingPos?.blockIndex,
              blockOffsetPercent: readingPos?.blockOffsetPercent,
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
  }, [novelId, chapterNum, calculateProgress, getCurrentReadingPosition]);

  // Record chapter open immediately so history exists even if the user
  // navigates away before scrolling enough to trigger the scroll handler.
  useEffect(() => {
    if (!novelId) return;

    api
      .getHistoryForNovel(novelId)
      .then((history: ReadingHistory | null) => {
        if (
          history &&
          history.chapterNum === chapterNum &&
          (history.progressPercent ?? 0) > 0
        ) {
          return;
        }
        const readingPos = getCurrentReadingPosition();
        api
          .updateProgress({
            novelId,
            chapterNum,
            lastReadBlockIndex: readingPos?.blockIndex,
            blockOffsetPercent: readingPos?.blockOffsetPercent,
            scrollPosition: window.scrollY,
            progressPercent: 0,
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [novelId, chapterNum, getCurrentReadingPosition]);

  // Restore saved reading position on return
  useEffect(() => {
    if (!novelId || window.scrollY > 0) return;

    let cancelled = false;

    api
      .getHistoryForNovel(novelId)
      .then((history: ReadingHistory | null) => {
        if (cancelled) return;
        if (!history || history.chapterNum !== chapterNum) return;
        if (history.lastReadBlockIndex == null) return;

        const tryRestore = (attemptsLeft = 30) => {
          if (cancelled) return;
          const blockCount = blockRefs.current.length;
          if (blockCount === 0) {
            if (attemptsLeft > 0) {
              requestAnimationFrame(() => tryRestore(attemptsLeft - 1));
            }
            return;
          }
          const blockIndex = Math.min(
            blockCount - 1,
            Math.max(0, history.lastReadBlockIndex)
          );
          const el = blockRefs.current[blockIndex];
          if (!el) {
            if (attemptsLeft > 0) {
              requestAnimationFrame(() => tryRestore(attemptsLeft - 1));
            }
            return;
          }
          const rect = el.getBoundingClientRect();
          const blockHeight = rect.height;
          if (blockHeight <= 0) {
            if (attemptsLeft > 0) {
              requestAnimationFrame(() => tryRestore(attemptsLeft - 1));
            }
            return;
          }

          const offset = Math.min(100, Math.max(0, history.blockOffsetPercent));
          const offsetPx = (offset / 100) * blockHeight;
          const targetY = el.offsetTop + offsetPx - 80;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
        };

        requestAnimationFrame(() => tryRestore());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [novelId, chapterNum]);

  // Save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (novelId) {
        const progress = calculateProgress();
        const data = JSON.stringify({
          novelId,
          chapterNum,
          lastReadBlockIndex: lastReadingPos.current?.blockIndex ?? null,
          blockOffsetPercent: lastReadingPos.current?.blockOffsetPercent ?? 0,
          scrollPosition: window.scrollY,
          progressPercent: progress,
        });
        const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';
        const token = localStorage.getItem('token');
        fetch(`${apiUrl}/user/history/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [novelId, chapterNum, calculateProgress]);

  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === 'ArrowLeft' && chapter.prevChapterNum) {
        window.location.href = `/novel/${slug}/read/${chapter.prevChapterNum}`;
      }
      if (e.key === 'ArrowRight' && chapter.nextChapterNum) {
        window.location.href = `/novel/${slug}/read/${chapter.nextChapterNum}`;
      }
      if (e.key === 't' || e.key === 'T') setShowToc((prev) => !prev);
      if (e.key === 'Escape') {
        setShowToc(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chapter, slug]);

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

  const getPanelBg = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-[#292524] border-white/5 text-stone-100';
      case 'sepia':
        return 'bg-[#f4ecd8] border-[#eaddc5] text-[#5b4636]';
      default:
        return 'bg-white border-stone-100 text-stone-800';
    }
  };

  const getTocBg = () => {
    switch (settings.theme) {
      case 'dark':
        return 'border-white/5 bg-[#1c1917]';
      case 'sepia':
        return 'border-[#eaddc5] bg-[#f4ecd8]';
      default:
        return 'border-stone-200 bg-[#faf8f5]';
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${getThemeColors()} transition-colors duration-300`}>
      {/* NAVBAR */}
      <div
        className={`fixed top-0 z-50 flex w-full items-center justify-between border-b p-3 backdrop-blur-md transition-colors duration-500 ${getNavbarColors()}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <a
            href={`/novel/${slug}`}
            className="flex-shrink-0 rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft size={18} />
          </a>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-sm font-semibold opacity-90">
              {chapter.title}
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

          <a
            href={`/admin/edit/${slug}/${chapterNum}`}
            className="rounded-full p-2 opacity-50 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
            title="Edit Chapter"
          >
            <Edit size={16} />
          </a>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-full p-2 transition ${showSettings ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div
          ref={settingsRef}
          className={`animate-fade-in fixed right-3 top-14 z-50 w-72 rounded-2xl border p-5 shadow-xl ${getPanelBg()}`}
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

            {/* Theme */}
            <div className="mb-6 space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium opacity-50">
                <Sun size={11} /> Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'sepia', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={`flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-medium transition ${
                      settings.theme === t
                        ? t === 'light'
                          ? 'border-stone-800 bg-stone-50 text-stone-900'
                          : t === 'sepia'
                            ? 'border-amber-700 bg-[#f4ecd8] text-[#5b4636]'
                            : 'border-stone-600 bg-stone-900 text-stone-100'
                        : 'border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full border ${
                        t === 'light'
                          ? 'border-stone-300 bg-white'
                          : t === 'sepia'
                            ? 'border-[#eaddc5] bg-[#f4ecd8]'
                            : 'border-stone-600 bg-stone-900'
                      }`}
                    />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
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
                    setSettings({ ...settings, fontFamily: 'font-sans' })
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
                    setSettings({ ...settings, fontFamily: 'font-serif' })
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
                <label className="text-xs font-medium opacity-50">Size</label>
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

      {/* TOC DRAWER */}
      <div
        onClick={() => setShowToc(false)}
        className={`fixed inset-0 z-[55] bg-black/30 transition-opacity duration-200 ${
          showToc ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={tocRef}
        className={`fixed left-0 top-0 z-[60] flex h-full w-full flex-col overflow-hidden border-r shadow-2xl transition-transform duration-300 ease-out sm:w-80 ${
          showToc ? 'translate-x-0' : '-translate-x-full'
        } ${getTocBg()}`}
      >
              <div
                className="flex items-center justify-between border-b p-4 backdrop-blur-md"
                style={{
                  borderColor:
                    settings.theme === 'sepia' ? '#eaddc5' : undefined,
                }}
              >
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
                      const translation = ch.translations?.find(
                        (t) => t.language === 'EN'
                      );
                      const title = translation
                        ? translation.title
                        : `Chapter ${ch.chapterNum}`;
                      const publishedDate = translation?.publishedAt
                        ? new Date(translation.publishedAt)
                        : new Date(0);
                      const isLocked = publishedDate > new Date();
                      const isCurrent = ch.chapterNum === chapterNum;

                      return (
                        <a
                          key={ch.chapterNum}
                          href={
                            isLocked
                              ? '#'
                              : `/novel/${slug}/read/${ch.chapterNum}`
                          }
                          onClick={(e) => {
                            if (isLocked) e.preventDefault();
                            else setShowToc(false);
                          }}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                            isCurrent
                              ? settings.theme === 'sepia'
                                ? 'bg-[#eaddc5] font-semibold'
                                : 'bg-black/5 font-semibold dark:bg-white/10'
                              : isLocked
                                ? 'cursor-not-allowed opacity-40'
                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <span
                            className={`w-8 flex-shrink-0 font-mono text-xs ${
                              isCurrent ? 'opacity-100' : 'opacity-40'
                            }`}
                          >
                            {ch.chapterNum}
                          </span>
                          <span className="truncate">{title}</span>
                          {isLocked && (
                            <Lock
                              size={12}
                              className="ml-auto flex-shrink-0 opacity-40"
                            />
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

      {/* CONTENT AREA */}
      <div className="mx-auto w-full max-w-2xl flex-grow px-5 pb-40 pt-24 sm:px-8">
        <article
          className={`${settings.fontFamily} ${settings.textAlign} transition-all duration-300 ease-in-out`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {parsedBlocks.map((block, index) => (
            <div
              key={block.id}
              ref={setBlockRef(index)}
              className="mb-6"
            >
              {block.type === 'header' ? (
                <h3 className="mb-8 mt-16 text-center text-2xl font-bold leading-tight opacity-90 sm:text-3xl">
                  {block.content}
                </h3>
              ) : (
                <div
                  className="opacity-90"
                  dangerouslySetInnerHTML={{
                    __html: renderReaderMarkdown(block.content),
                  }}
                />
              )}
            </div>
          ))}
        </article>

        {/* COMMENTS */}
        {chapter.chapterId && (
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
          <a
            href={
              chapter.prevChapterNum
                ? `/novel/${slug}/read/${chapter.prevChapterNum}`
                : '#'
            }
            onClick={(e) => !chapter.prevChapterNum && e.preventDefault()}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
              !chapter.prevChapterNum
                ? 'cursor-not-allowed opacity-30'
                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/5'
            }`}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </a>

          <div className="flex flex-col items-center">
            <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-30">
              Chapter
            </span>
            <span className="text-lg font-bold leading-none opacity-70">
              {chapterNum}
            </span>
          </div>

          <a
            href={
              chapter.nextChapterNum
                ? `/novel/${slug}/read/${chapter.nextChapterNum}`
                : '#'
            }
            onClick={(e) => !chapter.nextChapterNum && e.preventDefault()}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
              !chapter.nextChapterNum
                ? 'cursor-not-allowed opacity-30'
                : 'hover:bg-black/5 active:scale-95 dark:hover:bg-white/5'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
