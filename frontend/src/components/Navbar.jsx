import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Sparkles, BookOpen, Compass } from 'lucide-react';

const Navbar = () => {
  const { theme, toggleTheme, selectedFile, uploadedFiles, setSelectedFile } = useApp();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload", label: "Upload" },
    { to: "/chat", label: "Document Chat" },
    { to: "/summary", label: "Summary" },
    { to: "/quiz", label: "Quiz" },
    { to: "/explain", label: "Explain" },
    { to: "/translate", label: "Translate" }
  ];

  return (
    <header className="glass sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3 flex items-center justify-between transition-colors duration-300">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 font-display font-bold text-xl text-slate-800 dark:text-slate-100 hover:opacity-90">
        <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-xl text-white shadow-md shadow-violet-500/20">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent font-display tracking-tight">
          LearnAI
        </span>
      </NavLink>

      {/* Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/10">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Utilities */}
      <div className="flex items-center gap-3">
        {/* Active file indicator dropdown */}
        {uploadedFiles.length > 0 ? (
          <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-xl max-w-[200px]">
            <BookOpen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <select
              value={selectedFile?.filename || ""}
              onChange={(e) => {
                const found = uploadedFiles.find(f => f.filename === e.target.value);
                if (found) setSelectedFile(found);
              }}
              className="bg-transparent text-xs font-semibold text-violet-700 dark:text-violet-300 outline-none border-none cursor-pointer truncate max-w-[140px]"
            >
              {uploadedFiles.map((file) => (
                <option key={file.filename} value={file.filename} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {file.filename}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <NavLink 
            to="/upload" 
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Compass className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="hidden sm:inline">No documents uploaded</span>
          </NavLink>
        )}

        {/* Theme toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 cursor-pointer"
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
