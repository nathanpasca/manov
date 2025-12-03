import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Loader, Type, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const EditChapter = () => {
    const { slug, chapterNum } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Edit Chapter | Manov";
    }, []);

    const [chapter, setChapter] = useState(null);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const res = await api.get(`/novels/${slug}/chapters/${chapterNum}`);
                setChapter(res.data);
                setContent(res.data.content);
                setTitle(res.data.title);
            } catch (err) {
                console.error("Error fetching:", err);
                toast.error("Gagal mengambil data chapter");
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
                toast.error("Error: Translation ID not found. Mohon update backend.");
                return;
            }

            await api.put(`/admin/chapters/${chapter.id}`, {
                title: title,
                content: content
            });

            toast.success("Berhasil disimpan!");
            navigate(`/novel/${slug}/read/${chapterNum}`);
        } catch (err) {
            console.error("Error saving:", err);
            toast.error("Gagal menyimpan perubahan.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
            <Loader className="animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* HEADER EDITOR */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between z-50 transition-colors duration-300"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText size={12} /> Editor Mode
                        </h1>
                        <h2 className="text-lg font-bold truncate max-w-[200px] sm:max-w-md">Chapter {chapterNum}</h2>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30 transition active:scale-95"
                >
                    {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    <span className="hidden sm:inline">Save Changes</span>
                </button>
            </motion.div>

            {/* EDIT AREA */}
            <div className="max-w-4xl mx-auto pt-28 pb-20 px-6">

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
                        className="w-full text-3xl md:text-4xl font-black bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-700 outline-none p-0"
                    />
                </motion.div>

                {/* Content Input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute -left-8 top-0 text-gray-300 dark:text-gray-700 hidden md:block">
                        <Type size={20} />
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your story here..."
                        className="w-full min-h-[70vh] font-serif text-lg leading-relaxed bg-transparent border-none focus:ring-0 resize-none outline-none placeholder-gray-300 dark:placeholder-gray-700"
                        spellCheck="false"
                    />
                </motion.div>

            </div>
        </div>
    );
};

export default EditChapter;