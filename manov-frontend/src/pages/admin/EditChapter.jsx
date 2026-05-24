import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { novelService, adminService } from '../../services';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Loader, Type, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const EditChapter = () => {
    const { slug, chapterNum } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Edit Chapter | Manov';
    }, []);

    const [chapter, setChapter] = useState(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const res = await novelService.getChapter(
                    slug,
                    chapterNum
                );
                setChapter(res.data);
                setContent(res.data.content);
                setTitle(res.data.title);
            } catch (err) {
                console.error('Error fetching:', err);
                toast.error('Gagal mengambil data chapter');
            } finally {
                setLoading(false);
            }
        };
        fetchChapter();
    }, [slug, chapterNum]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!chapter?.id) {
                toast.error(
                    'Error: Translation ID not found. Mohon update backend.'
                );
                return;
            }

            await adminService.updateChapter(chapter.id, {
                title: title,
                content: content,
            });

            toast.success('Berhasil disimpan!');
            navigate(`/novel/${slug}/read/${chapterNum}`);
        } catch (err) {
            console.error('Error saving:', err);
            toast.error('Gagal menyimpan perubahan.');
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
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-100">
            {/* HEADER EDITOR */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-black/80"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                            <FileText size={12} /> Editor Mode
                        </h1>
                        <h2 className="max-w-[200px] truncate text-lg font-bold sm:max-w-md">
                            Chapter {chapterNum}
                        </h2>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader className="animate-spin" size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    <span className="hidden sm:inline">Save Changes</span>
                </button>
            </motion.div>

            {/* EDIT AREA */}
            <div className="mx-auto max-w-4xl px-6 pb-20 pt-28">
                {/* Title Input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Chapter Title"
                        className="w-full border-none bg-transparent p-0 text-3xl font-black placeholder-gray-300 outline-none focus:ring-0 md:text-4xl dark:placeholder-gray-700"
                    />
                </motion.div>

                {/* Content Input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute -left-8 top-0 hidden text-gray-300 md:block dark:text-gray-700">
                        <Type size={20} />
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your story here..."
                        className="min-h-[70vh] w-full resize-none border-none bg-transparent font-serif text-lg leading-relaxed placeholder-gray-300 outline-none focus:ring-0 dark:placeholder-gray-700"
                        spellCheck="false"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default EditChapter;
