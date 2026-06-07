import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'light') {
      setIsDark(false);
    } else {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/5"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
