import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Novel } from '../../lib/types';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Loader, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddChapterProps {
  slug: string;
}

export default function AddChapter({ slug }: AddChapterProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [novel, setNovel] = useState<Novel | null>(null);

  const [formData, setFormData] = useState({
    chapterNum: '',
    title: '',
    content: '',
  });

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const data = await api.getNovel(slug);
        const novelData = data as Novel;
        setNovel(novelData);
        const nextNum =
          novelData.chapters && novelData.chapters.length > 0
            ? Math.max(...novelData.chapters.map((c) => c.chapterNum)) + 1
            : 1;
        setFormData((prev) => ({ ...prev, chapterNum: String(nextNum) }));
      } catch (err) {
        toast.error('Failed to load novel');
        window.location.href = '/admin';
      } finally {
        setLoading(false);
      }
    };
    fetchNovel();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content)
      return toast.error('Title and Content are required');
    if (!novel) return;

    setSaving(true);
    try {
      await api.createChapter(novel.id, {
        chapterNum: parseInt(formData.chapterNum),
        title: formData.title,
        content: formData.content,
      });
      toast.success('Chapter added successfully!');
      window.location.href = `/admin/edit-novel/${slug}`;
    } catch (err: any) {
      toast.error(
        'Error adding chapter: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setSaving(false);
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
        <div className="mb-8 flex items-center gap-4">
          <a
            href={`/admin/edit-novel/${slug}`}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="text-2xl font-bold">Add Chapter</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adding to:{" "}
              <span className="font-bold text-stone-600">
                {novel?.title}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="md:col-span-1">
                <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                  Chapter #
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono font-bold outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                  value={formData.chapterNum}
                  onChange={(e) =>
                    setFormData({ ...formData, chapterNum: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
                  Chapter Title
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. The Beginning"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                <FileText size={14} /> Content (English)
              </label>
              <textarea
                rows={20}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-serif text-lg leading-relaxed outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Paste chapter content here..."
              />
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
              Save Chapter
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
