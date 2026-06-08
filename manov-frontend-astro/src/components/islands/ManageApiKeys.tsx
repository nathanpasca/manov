import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ApiKey, ApiKeyCreateResponse } from '../../lib/types';
import toast from 'react-hot-toast';
import {
  Key,
  Plus,
  Trash2,
  ArrowLeft,
  Loader,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchApiKeys = async () => {
    try {
      const data = await api.listApiKeys();
      setApiKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(
        'Failed to load API keys: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const data = await api.createApiKey(newKeyName.trim());
      setCreatedKey(data);
      setNewKeyName('');
      toast.success('API key created! Copy it now — it will not be shown again.');
      fetchApiKeys();
    } catch (err: any) {
      toast.error(
        'Failed to create API key: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this API key? Any clients using it will lose access.')) return;
    setRevokingId(id);
    try {
      await api.revokeApiKey(id);
      toast.success('API key revoked');
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (err: any) {
      toast.error(
        'Failed to revoke API key: ' + (err.response?.data?.detail || err.message)
      );
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24 font-sans text-gray-900 transition-colors duration-300 md:p-10 dark:bg-[#0a0a0a] dark:text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-center gap-4">
          <a
            href="/admin"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Key className="text-stone-500" /> API Keys
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage API keys for AI agent access to /mcp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="mb-4 font-bold">Create New Key</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <input
                    type="text"
                    placeholder="e.g. Cursor MCP, Claude Desktop"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={creating || !newKeyName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader className="animate-spin" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    Create Key
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
                  <Shield size={16} />
                  How to use
                </h4>
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400/80">
                  Configure your MCP client with the SSE URL including your API key as a query parameter:
                </p>
                <code className="mt-2 block break-all rounded-lg bg-amber-100/50 px-3 py-2 text-[10px] text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  https://your-domain.com/mcp?api_key=manov_xxx
                </code>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {/* Newly created key banner */}
            <AnimatePresence>
              {createdKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Copy this key now — it will not be shown again
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-xl bg-emerald-100/50 px-4 py-3 font-mono text-sm text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                      {showKey ? createdKey.key : '•'.repeat(createdKey.key.length)}
                    </code>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="rounded-xl p-3 text-emerald-600 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                      title={showKey ? 'Hide' : 'Show'}
                    >
                      {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(createdKey.key)}
                      className="rounded-xl p-3 text-emerald-600 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                      title="Copy"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => setCreatedKey(null)}
                    className="mt-3 text-xs font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                {apiKeys.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    <Key size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No API keys yet.</p>
                    <p className="mt-1 text-sm">Create one to connect AI agents to /mcp</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    <AnimatePresence>
                      {apiKeys.map((key) => (
                        <motion.div
                          key={key.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 transition hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="truncate font-medium">{key.name}</span>
                                {key.isActive ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    Active
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400">
                                    Revoked
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Key size={12} />
                                  {key.keyPrefix}••••••••
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Created {formatDate(key.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Last used {formatDate(key.lastUsedAt)}
                                </span>
                              </div>
                            </div>
                            {key.isActive && (
                              <button
                                onClick={() => handleRevoke(key.id)}
                                disabled={revokingId === key.id}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10"
                                title="Revoke"
                              >
                                {revokingId === key.id ? (
                                  <Loader className="animate-spin" size={18} />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            )}
                          </div>
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
}
