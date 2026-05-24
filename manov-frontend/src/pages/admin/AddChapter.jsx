import React, { useState, useEffect } from 'react';
import { novelService, adminService } from '../../services';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const AddChapter = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Add Chapter | Manov';
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [novel, setNovel] = useState(null);

    const [formData, setFormData] = useState({
        chapterNum: '',
        title: '',
        content: '',
    });

    useEffect(() => {
        const fetchNovel = async () => {
            try {
                const res = await novelService.getBySlug(slug);
                setNovel(res.data);
                // Auto-suggest next chapter number
                const nextNum =
                    res.data.chapters.length > 0
                        ? Math.max(
                              ...res.data.chapters.map((c) => c.chapterNum)
                          ) + 1
                        : 1;
                setFormData((prev) => ({ ...prev, chapterNum: nextNum }));
            } catch (err) {
                toast.error('Gagal load novel');
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchNovel();
    }, [slug, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content)
            return toast.error('Title and Content are required');

        setSaving(true);
        try {
            await adminService.createChapter(novel.id, {
                chapterNum: parseInt(formData.chapterNum),
                title: formData.title,
                content: formData.content,
            });
            toast.success('Chapter added successfully!');
            navigate(`/admin/edit-novel/${slug}`);
        } catch (err) {
            toast.error(
                'Error adding chapter: ' +
                    (err.response?.data?.detail || err.message)
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
                {/* HEADER */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/admin/edit-novel/${slug}`)}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Add Chapter</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Adding to:{' '}
                            <span className="font-bold text-blue-500">
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
                                        setFormData({
                                            ...formData,
                                            chapterNum: e.target.value,
                                        })
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
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
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
                                    setFormData({
                                        ...formData,
                                        content: e.target.value,
                                    })
                                }
                                placeholder="Paste chapter content here..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-50"
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
};

export default AddChapter;
