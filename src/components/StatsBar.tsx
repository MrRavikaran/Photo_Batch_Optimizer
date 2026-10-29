import React from 'react';
import { BatchStats } from '../types';
import { Play, Pause, XCircle, Trash2, FolderDown, Download, CheckCircle2, AlertTriangle, Loader2, FileEdit } from 'lucide-react';

interface StatsBarProps {
  stats: BatchStats;
  isProcessing: boolean;
  onProcessAll: () => void;
  onCancelAll: () => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onDownloadZip: () => void;
  onSaveToFolder?: () => void;
  onOpenBatchRename?: () => void;
  supportsDirectoryPicker: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  isProcessing,
  onProcessAll,
  onCancelAll,
  onClearCompleted,
  onClearAll,
  onDownloadZip,
  onSaveToFolder,
  onOpenBatchRename,
  supportsDirectoryPicker,
}) => {
  const originalMb = (stats.originalBytes / (1024 * 1024)).toFixed(1);
  const optimizedMb = (stats.optimizedBytes / (1024 * 1024)).toFixed(1);
  const savedMb = (stats.savedBytes / (1024 * 1024)).toFixed(1);
  const progressPercent = stats.totalCount > 0 
    ? Math.round(((stats.completedCount + stats.failedCount) / stats.totalCount) * 100) 
    : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      
      {/* Metric Counters (Clean unboxed metadata, tabular figures) */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-neutral-300">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
            Batch Status
          </span>
          <div className="flex items-center gap-2 font-mono font-medium mt-0.5">
            {isProcessing && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
            <span className="text-white tabular-nums">
              {stats.completedCount}/{stats.totalCount} Done
            </span>
            {stats.failedCount > 0 && (
              <span className="text-red-400 font-mono text-[11px] tabular-nums">
                ({stats.failedCount} failed)
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-neutral-800" />

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
            Payload Size
          </span>
          <div className="flex items-center gap-1.5 font-mono mt-0.5">
            <span className="text-neutral-400 tabular-nums">{originalMb} MB</span>
            <span className="text-neutral-600">→</span>
            <span className="text-emerald-400 font-semibold tabular-nums">{optimizedMb} MB</span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-neutral-800" />

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
            Total Saved
          </span>
          <div className="flex items-center gap-1.5 font-mono mt-0.5">
            <span className="text-emerald-400 font-bold text-sm tabular-nums">
              {savedMb} MB
            </span>
            <span className="text-emerald-500/80 text-xs font-semibold tabular-nums">
              (-{stats.savedPercent}%)
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        {stats.totalCount > 0 && (
          <div className="w-full sm:w-28 flex flex-col gap-1 mt-1 sm:mt-0">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>{progressPercent}%</span>
              <span>{stats.pendingCount} left</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {stats.pendingCount > 0 && (
          <button
            type="button"
            onClick={onProcessAll}
            disabled={isProcessing}
            title="Process All photos in queue (Ctrl+Enter)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Process All ({stats.pendingCount})</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-emerald-700/80 px-1 py-0.5 rounded text-emerald-100 ml-0.5">
              Ctrl+↵
            </kbd>
          </button>
        )}

        {isProcessing && (
          <button
            type="button"
            onClick={onCancelAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}

        {stats.completedCount > 0 && (
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            title="Download handcrafted ZIP with all optimized photos (Ctrl+S)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download ZIP</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-neutral-700/80 px-1 py-0.5 rounded text-neutral-300 ml-0.5">
              Ctrl+S
            </kbd>
          </button>
        )}

        {stats.totalCount > 0 && onOpenBatchRename && (
          <button
            type="button"
            onClick={onOpenBatchRename}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap"
            title="Batch rename files using regex or search and replace"
          >
            <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
            <span>Batch Rename</span>
          </button>
        )}

        {supportsDirectoryPicker && onSaveToFolder && stats.completedCount > 0 && (
          <button
            type="button"
            onClick={onSaveToFolder}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap"
            title="Chromium File System Access API: write files directly into a local folder"
          >
            <FolderDown className="w-3.5 h-3.5 text-teal-400" />
            <span>Save to Folder</span>
          </button>
        )}

        {stats.totalCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1"
            title="Clear all photos from queue (Ctrl+Delete)"
            aria-label="Clear all photos (Ctrl+Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
