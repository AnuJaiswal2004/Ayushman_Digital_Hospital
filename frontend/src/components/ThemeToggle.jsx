import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../services/theme.js';

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (currentTheme) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4.5 w-4.5 text-amber-500" />;
      case 'dark':
        return <Moon className="h-4.5 w-4.5 text-indigo-400" />;
      default:
        return <Laptop className="h-4.5 w-4.5 text-slate-400 dark:text-slate-400" />;
    }
  };

  const getThemeLabel = (currentTheme) => {
    switch (currentTheme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
    }
  };

  const options = [
    { id: 'light', label: 'Light Theme', icon: <Sun className="h-4 w-4 text-amber-500" /> },
    { id: 'dark', label: 'Dark Theme', icon: <Moon className="h-4 w-4 text-indigo-400" /> },
    { id: 'system', label: 'System Theme', icon: <Laptop className="h-4 w-4 text-slate-400" /> }
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
        title={`Active: ${getThemeLabel(theme)} Mode`}
      >
        {getThemeIcon(theme)}
        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
          {getThemeLabel(theme)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-0.5 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setTheme(opt.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer ${
                theme === opt.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
