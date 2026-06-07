import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Novel, Genre, Chapter } from '../../lib/types';
import toast from 'react-hot-toast';
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Book,
  User,
  Info,
  Loader,
  Plus,
  Trash2,
  Edit,
  Link as LinkIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface EditNovelMetadataProps {
  slug: string;
}

export default function EditNovelMetadata({ slug }: EditNovelMetadataProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    originalTitle: '',
    slug: '',
    author: '',
    coverUrl: '',
    synopsis: '',
    status: 'ONGOING' as 'ONGOING' | 'COMPLETED' | 'HIATUS',
    chapters: [] as Chapter[],
  });

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [novelData, genresData] = await Promise.all([
          api.getNovel(slug),
          api.getGenres(),
        ]);

        const novel = novelData as Novel;
        setFormData({
          id: novel.id,
          title: novel.title,
          originalTitle: novel.originalTitle,
          slug: novel.slug,
          author: novel.author || '',
          coverUrl: novel.coverUrl || '',
          synopsis: novel.synopsis || '',
          status: novel.status,
          chapters: novel.chapters || [],
        });

        setGenres(Array.isArray(genresData) ? genresData : genresData.data || []);
        setSelectedGenres(
          novel.genres ? novel.genres.map((g: Genre) => g.id) : []
        );
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  const toggleGenre = (id: string) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateNovel(formData.id, {
        ...formData,
        genres: selectedGenres,
      });
      toast.success('Metadata updated!');
      window.location.href = '/admin';
    } catch (err: any) {
      toast.error('Error updating: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshChapters = async () => {
    try {
      const novelData = await api.getNovel(slug);
      const novel = novelData as Novel;
      setFormData((prev) => ({ ...prev, chapters: novel.chapters || [] }));
    } catch (err) {
      toast.error('Failed to refresh chapters');
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader className="animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900 transition-colors duration-300 md:p-10 dark:bg-[#0a0a0a] dark:text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <ArrowLeft size={24} />
            </a>
            <div>
              <h1 className="text-2xl font-bold">Edit Metadata</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update novel details and status
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                    <Book size={14} /> Title (Display)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg font-bold outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                    <LinkIcon size={14} /> Slug (URL Fragment)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-stone-600 outline-none transition focus:ring-1 focus:ring-stone-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                  <p className="ml-1 mt-1 text-[10px] text-gray-400">
                    Warning: Changing this will change the URL. Make sure no broken links occur.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                      <Info size={14} /> Original Title
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                      value={formData.originalTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalTitle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                      <User size={14} /> Author
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                    <ImageIcon size={14} /> Cover Image URL
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={formData.coverUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, coverUrl: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Synopsis
                  </label>
                  <textarea
                    rows={8}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 leading-relaxed outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={formData.synopsis}
                    onChange={(e) =>
                      setFormData({ ...formData, synopsis: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as typeof formData.status,
                        })
                      }
                    >
                      <option value="ONGOING">ONGOING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="HIATUS">HIATUS</option>
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                    Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.id)}
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                          selectedGenres.includes(genre.id)
                            ? 'border-stone-800 bg-stone-900 text-white'
                            : 'border-transparent bg-gray-100 text-gray-600 hover:border-gray-300 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  Save Changes
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-1">
            <div className="sticky top-6">
              <h3 className="mb-4 text-xs font-bold uppercase text-gray-400">
                Live Preview
              </h3>
              <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-gray-200 dark:bg-white/10">
                  {formData.coverUrl ? (
                    <img
                      src={formData.coverUrl}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs">No Cover</span>
                    </div>
                  )}
                  <div className="absolute right-2 top-2 rounded-md bg-stone-800 px-2 py-1 text-[10px] font-bold text-white">
                    {formData.status}
                  </div>
                </div>
                <h4 className="mb-1 text-lg font-bold leading-tight dark:text-white">
                  {formData.title || 'Novel Title'}
                </h4>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  {formData.author || 'Author Name'}
                </p>
                <div className="line-clamp-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  {formData.synopsis ? (
                    <ReactMarkdown
                      components={{
                        p: ({ ...props }) => (
                          <p className="mb-2 leading-relaxed" {...props} />
                        ),
                        strong: ({ ...props }) => (
                          <span className="font-bold" {...props} />
                        ),
                        em: ({ ...props }) => (
                          <span className="italic" {...props} />
                        ),
                      }}
                    >
                      {formData.synopsis}
                    </ReactMarkdown>
                  ) : (
                    <p>Synopsis will appear here...</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-400">
                    Chapters
                  </h3>
                  <a
                    href={`/admin/add-chapter/${slug}`}
                    className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
                  >
                    <Plus size={12} /> Add
                  </a>
                </div>

                <div className="max-h-[400px] overflow-hidden overflow-y-auto rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/5">
                  {formData.chapters && formData.chapters.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {formData.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="group flex items-center justify-between p-3 transition hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="w-8 font-mono text-xs font-bold text-gray-400">
                              #{chapter.chapterNum}
                            </span>
                            <span className="truncate text-sm font-medium dark:text-gray-200">
                              {chapter.translations.find(
                                (t) => t.language === 'EN'
                              )?.title || 'Untitled'}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                            <a
                              href={`/admin/edit/${slug}/${chapter.chapterNum}`}
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-stone-50 hover:text-stone-600 dark:hover:bg-white/5"
                            >
                              <Edit size={14} />
                            </a>
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this chapter?')) return;
                                try {
                                  await api.deleteChapter(chapter.id);
                                  toast.success('Deleted');
                                  refreshChapters();
                                } catch (e) {
                                  toast.error('Failed to delete');
                                }
                              }}
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">
                      No chapters yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
