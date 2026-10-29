import React from 'react';
import { Download, Sparkles, Layers, ShieldCheck, Sun, Moon } from 'lucide-react';

interface TopNavProps {
  onOpenPresets: () => void;
  onOpenPrivacy: () => void;
  onExportAll: () => void;
  isProcessing: boolean;
  completedCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenPresets,
  onOpenPrivacy,
  onExportAll,
  isProcessing,
  completedCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs font-black text-black">
          PO
        </span>
        <span>PhotoBatch Optimizer</span>
      </a>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          type="button"
          onClick={onOpenPresets}
          className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
        >
          E-Commerce Presets
        </button>
        <a
          href="#features"
          onClick={(e) => { e.preventDefault(); onOpenPresets(); }}
          className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
        >
          Preset Guidelines
        </a>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
        >
          Client-Side Privacy
        </button>
        <span className="text-neutral-600">·</span>
        <span className="text-neutral-500 font-mono text-[11px] whitespace-nowrap shrink-0">
          Zero-Upload Sandbox
        </span>
      </nav>

      {/* Zone 3: 1 primary action + theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onExportAll}
          disabled={completedCount === 0 || isProcessing}
          title="Download all optimized photos in a ZIP archive (Ctrl+S)"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download All as ZIP ({completedCount})</span>
          <kbd className="hidden lg:inline-block text-[10px] font-mono bg-emerald-700/80 px-1 py-0.5 rounded text-emerald-100 ml-0.5">
            Ctrl+S
          </kbd>
        </button>
      </div>
    </header>
  );
};
