import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface AdminNovelActionsProps {
  novelId: string;
  slug: string;
}

export default function AdminNovelActions({ novelId, slug }: AdminNovelActionsProps) {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') return null;

  const handleDelete = () => {
    toast(
      (t) => (
        <div className="flex min-w-[200px] flex-col gap-3 rounded-2xl border border-stone-100 bg-white p-4 text-stone-900 shadow-xl dark:border-white/10 dark:bg-[#1c1917] dark:text-white">
          <span className="font-medium">Delete this novel?</span>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.deleteNovel(novelId);
                  toast.success('Novel deleted');
                  window.location.href = '/';
                } catch {
                  toast.error('Failed to delete novel');
                }
              }}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-center',
        style: { background: 'transparent', boxShadow: 'none', padding: 0 },
      }
    );
  };

  return (
    <div className="mt-8 border-t border-stone-100 pt-6 dark:border-white/10">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">
        Admin Actions
      </h4>
      <div className="flex flex-col gap-2">
        <a
          href={`/admin/edit-novel/${slug}`}
          className="w-full rounded-lg bg-stone-900 py-2 text-center text-sm font-medium text-white transition hover:bg-stone-700"
        >
          Edit Metadata
        </a>
        <button
          onClick={handleDelete}
          className="w-full rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white dark:text-red-400"
        >
          Delete Novel
        </button>
      </div>
    </div>
  );
}
