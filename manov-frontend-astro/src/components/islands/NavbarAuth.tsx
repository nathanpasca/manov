import { useAuth } from '../../lib/auth';
import { LayoutDashboard, X } from 'lucide-react';

export default function NavbarAuth() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center gap-3 border-l border-stone-200 pl-4 dark:border-white/5">
        <a
          href="/login"
          className="text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-l border-stone-200 pl-4 dark:border-white/5">
      {user.role === 'ADMIN' && (
        <a
          href="/admin"
          className="flex items-center gap-1 text-sm font-medium text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <LayoutDashboard size={14} /> Admin
        </a>
      )}

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
          {user.username}
        </span>
      </div>

      <button
        onClick={logout}
        className="text-stone-400 transition hover:text-red-600"
        title="Logout"
      >
        <X size={16} />
      </button>
    </div>
  );
}
