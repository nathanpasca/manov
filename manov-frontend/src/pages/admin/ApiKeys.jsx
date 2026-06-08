import { useEffect, useState } from 'react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { Key, ArrowLeft, Loader, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ApiKeys() {
    const navigate = useNavigate();
    const [keys, setKeys] = useState([]);
    const [name, setName] = useState('');
    const [newKey, setNewKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [revokingId, setRevokingId] = useState(null);

    const fetchKeys = async () => {
        try {
            const res = await adminService.getApiKeys();
            setKeys(res.data);
        } catch (err) {
            toast.error(
                'Failed to load API keys: ' +
                    (err.response?.data?.detail || err.message)
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'API Keys | Manov';
        fetchKeys();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            const res = await adminService.createApiKey(name);
            setNewKey(res.data.key);
            setName('');
            toast.success('API key created!');
            fetchKeys();
        } catch (err) {
            toast.error(
                'Failed to create API key: ' +
                    (err.response?.data?.detail || err.message)
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (id, keyName) => {
        if (!confirm(`Revoke API key "${keyName}"?`)) return;
        setRevokingId(id);
        try {
            await adminService.revokeApiKey(id);
            toast.success('API key revoked');
            fetchKeys();
        } catch (err) {
            toast.error(
                'Failed to revoke API key: ' +
                    (err.response?.data?.detail || err.message)
            );
        } finally {
            setRevokingId(null);
        }
    };

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
                        onClick={() => navigate('/admin')}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <Key className="text-stone-500" /> API Keys
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage API keys for external integrations
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* NEW KEY BANNER */}
                    {newKey && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="rounded-2xl border border-green-300 bg-green-50 p-4 text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100"
                        >
                            <p className="font-semibold">
                                Your new API key (copy it now — it will not be shown again):
                            </p>
                            <code className="mt-2 block break-all rounded bg-white p-3 text-sm dark:bg-black/20">
                                {newKey}
                            </code>
                            <button
                                type="button"
                                onClick={() => setNewKey(null)}
                                className="mt-3 text-sm font-medium underline transition hover:text-green-700 dark:hover:text-green-300"
                            >
                                Dismiss
                            </button>
                        </motion.div>
                    )}

                    {/* CREATE FORM */}
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <h3 className="mb-4 font-bold">Generate New Key</h3>
                        <form onSubmit={handleCreate} className="flex gap-2">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Key name (e.g. Claude Desktop)"
                                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                                required
                            />
                            <button
                                type="submit"
                                disabled={submitting || !name.trim()}
                                className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader className="animate-spin" size={18} />
                                ) : (
                                    <Plus size={18} />
                                )}
                                Generate Key
                            </button>
                        </form>
                    </div>

                    {/* KEYS TABLE */}
                    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader className="animate-spin text-gray-400" />
                            </div>
                        ) : keys.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">
                                No API keys yet. Create one above.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/10">
                                            <th className="px-4 py-3 font-semibold">Name</th>
                                            <th className="px-4 py-3 font-semibold">Prefix</th>
                                            <th className="px-4 py-3 font-semibold">Last Used</th>
                                            <th className="px-4 py-3 font-semibold">Created</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {keys.map((k) => (
                                            <tr
                                                key={k.id}
                                                className="transition hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                                <td className="px-4 py-3">{k.name}</td>
                                                <td className="px-4 py-3">
                                                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-white/10">
                                                        {k.keyPrefix}...
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {k.lastUsedAt
                                                        ? new Date(k.lastUsedAt).toLocaleString()
                                                        : 'Never'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {new Date(k.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            k.isActive
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                                                        }`}
                                                    >
                                                        {k.isActive ? 'Active' : 'Revoked'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {k.isActive && (
                                                        <button
                                                            onClick={() => handleRevoke(k.id, k.name)}
                                                            disabled={revokingId === k.id}
                                                            aria-label={`Revoke API key ${k.name}`}
                                                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10"
                                                        >
                                                            {revokingId === k.id ? (
                                                                <Loader className="animate-spin" size={16} />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
