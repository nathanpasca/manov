import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const AddChapter = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Add Chapter | Manov";
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [novel, setNovel] = useState(null);

    const [formData, setFormData] = useState({
        chapterNum: '',
        title: '',
        content: ''
    });

    useEffect(() => {
        const fetchNovel = async () => {
            try {
                const res = await api.get(`/novels/${slug}`);
                setNovel(res.data);
                // Auto-suggest next chapter number
                const nextNum = res.data.chapters.length > 0
                    ? Math.max(...res.data.chapters.map(c => c.chapterNum)) + 1
                    : 1;
                setFormData(prev => ({ ...prev, chapterNum: nextNum }));
            } catch (err) {
                toast.error("Gagal load novel");
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchNovel();
    }, [slug, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return toast.error("Title and Content are required");

        setSaving(true);
        try {
            await api.post(`/admin/novels/${novel.id}/chapters`, {
                chapterNum: parseInt(formData.chapterNum),
                title: formData.title,
                content: formData.content
            });
            toast.success("Chapter added successfully!");
            navigate(`/admin/edit-novel/${slug}`);
        } catch (err) {
            toast.error("Error adding chapter: " + (err.response?.data?.detail || err.message));
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
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans p-6 md:p-10 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(`/admin/edit-novel/${slug}`)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Add Chapter</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Adding to: <span className="font-bold text-blue-500">{novel?.title}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chapter #</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white font-mono font-bold"
                                    value={formData.chapterNum}
                                    onChange={e => setFormData({ ...formData, chapterNum: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chapter Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white font-bold"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. The Beginning"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                <FileText size={14} /> Content (English)
                            </label>
                            <textarea
                                rows={20}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white leading-relaxed font-serif text-lg"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Paste chapter content here..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Chapter
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AddChapter;
