import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Genre } from '../../lib/types';
import toast from 'react-hot-toast';
import { Trash2, Plus, Tag, ArrowLeft, Loader } from 'lucide-react';


export default function ManageGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGenre, setNewGenre] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchGenres = async () => {
    try {
      const data = await api.getGenres();
      setGenres(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load genres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenre.trim()) return;

    setAdding(true);
    try {
      await api.createGenre(newGenre.trim());
      toast.success('Genre added!');
      setNewGenre('');
      fetchGenres();
    } catch (err: any) {
      toast.error(
        'Failed to add genre: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this genre?')) return;
    try {
      await api.deleteGenre(id);
      toast.success('Genre deleted');
      setGenres(genres.filter((g) => g.id !== id));
    } catch (err) {
      toast.error('Failed to delete genre');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900 transition-colors duration-300 md:p-10 dark:bg-[#0a0a0a] dark:text-gray-100">
      <div className="animate-fade-up mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <a
            href="/admin"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Tag className="text-stone-500" /> Manage Genres
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add or remove novel genres
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="sticky top-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="mb-4 font-bold">Add New Genre</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <input
                  type="text"
                  placeholder="Genre Name (e.g. Fantasy)"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={adding || !newGenre.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  {adding ? (
                    <Loader className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  Add Genre
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                {genres.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    No genres found. Add one!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {genres.map((genre) => (
                      <div
                        key={genre.id}
                        className="flex items-center justify-between p-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                          <span className="font-medium">{genre.name}</span>
                          <button
                            onClick={() => handleDelete(genre.id)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
