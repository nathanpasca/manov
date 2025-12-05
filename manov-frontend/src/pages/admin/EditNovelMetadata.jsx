import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, Book, User, Info, Loader, Plus, Trash2, Edit, Link } from 'lucide-react';
import { motion } from 'framer-motion';

const EditNovelMetadata = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Edit Novel | Manov";
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        title: '',
        originalTitle: '',
        slug: '',
        author: '',
        coverUrl: '',
        synopsis: '',
        status: 'ONGOING',
        chapters: []
    });

    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [novelRes, genresRes] = await Promise.all([
                    api.get(`/novels/${slug}`),
                    api.get('/genres')
                ]);

                setFormData({
                    id: novelRes.data.id,
                    title: novelRes.data.title,
                    originalTitle: novelRes.data.originalTitle,
                    slug: novelRes.data.slug,
                    author: novelRes.data.author || '',
                    coverUrl: novelRes.data.coverUrl || '',
                    synopsis: novelRes.data.synopsis || '',
                    status: novelRes.data.status,
                    chapters: novelRes.data.chapters || []
                });

                setGenres(genresRes.data);
                setSelectedGenres(novelRes.data.genres ? novelRes.data.genres.map(g => g.id) : []);
            } catch (err) {
                toast.error("Gagal load data");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [slug]);

    const toggleGenre = (id) => {
        if (selectedGenres.includes(id)) {
            setSelectedGenres(selectedGenres.filter(g => g !== id));
        } else {
            setSelectedGenres([...selectedGenres, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/admin/novels/${formData.id}`, {
                ...formData,
                genres: selectedGenres
            });
            toast.success("Metadata updated!");
            navigate('/admin');
        } catch (err) {
            toast.error("Error updating: " + err.message);
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Metadata</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Update novel details and status</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: FORM */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                        <Book size={14} /> Title (Display)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white font-bold text-lg"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                        <Link size={14} /> Slug (URL Fragment)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white font-mono text-sm text-blue-500"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Warning: Changing this will change the URL. Make sure no broken links occur.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                            <Info size={14} /> Original Title
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white"
                                            value={formData.originalTitle}
                                            onChange={e => setFormData({ ...formData, originalTitle: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                            <User size={14} /> Author
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white"
                                            value={formData.author}
                                            onChange={e => setFormData({ ...formData, author: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                        <ImageIcon size={14} /> Cover Image URL
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white text-sm font-mono"
                                        value={formData.coverUrl}
                                        onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Synopsis</label>
                                    <textarea
                                        rows={8}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white leading-relaxed"
                                        value={formData.synopsis}
                                        onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white appearance-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="ONGOING">ONGOING</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="HIATUS">HIATUS</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Genres</label>
                                    <div className="flex flex-wrap gap-2">
                                        {genres.map(genre => (
                                            <button
                                                key={genre.id}
                                                type="button"
                                                onClick={() => toggleGenre(genre.id)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition border ${selectedGenres.includes(genre.id)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300 dark:hover:border-white/20'
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
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                                >
                                    {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW & CHAPTERS */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="sticky top-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Live Preview</h3>
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm mb-8">
                                <div className="aspect-[2/3] bg-gray-200 dark:bg-white/10 rounded-xl overflow-hidden mb-4 relative">
                                    {formData.coverUrl ? (
                                        <img src={formData.coverUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
                                            <ImageIcon size={32} />
                                            <span className="text-xs">No Cover</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                                        {formData.status}
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg leading-tight mb-1 dark:text-white">{formData.title || "Novel Title"}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{formData.author || "Author Name"}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
                                    {formData.synopsis || "Synopsis will appear here..."}
                                </p>
                            </div>

                            {/* CHAPTERS MANAGEMENT */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Chapters</h3>
                                    <button
                                        onClick={() => navigate(`/admin/add-chapter/${slug}`)}
                                        className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-1 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-blue-500/30 transition flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden max-h-[400px] overflow-y-auto">
                                    {formData.chapters && formData.chapters.length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                                            {formData.chapters.map(chapter => (
                                                <div key={chapter.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className="text-xs font-mono font-bold text-gray-400 w-8">#{chapter.chapterNum}</span>
                                                        <span className="text-sm font-medium truncate dark:text-gray-200">
                                                            {chapter.translations.find(t => t.language === 'EN')?.title || "Untitled"}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        <button
                                                            onClick={() => navigate(`/admin/edit/${slug}/${chapter.chapterNum}`)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm("Delete this chapter?")) return;
                                                                try {
                                                                    await api.delete(`/admin/chapters/${chapter.id}`);
                                                                    toast.success("Deleted");
                                                                    // Refresh data
                                                                    const res = await api.get(`/novels/${slug}`);
                                                                    setFormData(prev => ({ ...prev, chapters: res.data.chapters }));
                                                                } catch (e) {
                                                                    toast.error("Failed to delete");
                                                                }
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-xs">
                                            No chapters yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div >
            </motion.div >
        </div >
    );
};

export default EditNovelMetadata;