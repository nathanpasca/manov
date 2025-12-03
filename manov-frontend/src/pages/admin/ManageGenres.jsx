import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Trash2, Plus, Tag, ArrowLeft, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ManageGenres = () => {
    const navigate = useNavigate();
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newGenre, setNewGenre] = useState("");
    const [adding, setAdding] = useState(false);

    const fetchGenres = async () => {
        try {
            const res = await api.get('/genres');
            setGenres(res.data);
        } catch (err) {
            toast.error("Gagal memuat genres");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Manage Genres | Manov";
        fetchGenres();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newGenre.trim()) return;

        setAdding(true);
        try {
            await api.post('/admin/genres', { name: newGenre });
            toast.success("Genre added!");
            setNewGenre("");
            fetchGenres();
        } catch (err) {
            toast.error("Gagal menambah genre: " + (err.response?.data?.detail || err.message));
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus genre ini?")) return;
        try {
            await api.delete(`/admin/genres/${id}`);
            toast.success("Genre deleted");
            setGenres(genres.filter(g => g.id !== id));
        } catch (err) {
            toast.error("Gagal menghapus genre");
        }
    };

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
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tag className="text-blue-500" /> Manage Genres
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Add or remove novel genres</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* FORM ADD */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-white/5 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 sticky top-6">
                            <h3 className="font-bold mb-4">Add New Genre</h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Genre Name (e.g. Fantasy)"
                                    value={newGenre}
                                    onChange={e => setNewGenre(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={adding || !newGenre}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30"
                                >
                                    {adding ? <Loader className="animate-spin" size={18} /> : <Plus size={18} />}
                                    Add Genre
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* LIST GENRES */}
                    <div className="md:col-span-2">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader className="animate-spin text-gray-400" /></div>
                        ) : (
                            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                                {genres.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400">No genres found. Add one!</div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                                        <AnimatePresence>
                                            {genres.map(genre => (
                                                <motion.div
                                                    key={genre.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition"
                                                >
                                                    <span className="font-medium">{genre.name}</span>
                                                    <button
                                                        onClick={() => handleDelete(genre.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ManageGenres;
