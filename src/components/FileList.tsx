import React, { useState } from 'react';
import { ImageItem } from '../types';
import { 
  Play, 
  RotateCw, 
  X, 
  Download, 
  Eye, 
  Code, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';

interface FileListProps {
  items: ImageItem[];
  onProcessItem: (id: string) => void;
  onCancelItem: (id: string) => void;
  onRetryItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onCompareItem: (item: ImageItem) => void;
  onGenerateCode: (item: ImageItem) => void;
  onDownloadItem: (item: ImageItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  onProcessItem,
  onCancelItem,
  onRetryItem,
  onRemoveItem,
  onCompareItem,
  onGenerateCode,
  onDownloadItem,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* List Header & View Toggle */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">Photo Queue ({items.length})</span>
          <span className="text-neutral-600">·</span>
          <span>Click any card to inspect quality & savings</span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Grid View"
            aria-label="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Compact List View"
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => {
            const originalKb = Math.round(item.originalSize / 1024);
            const optimizedKb = item.optimizedSize ? Math.round(item.optimizedSize / 1024) : 0;
            const savingsPct = item.savingsPercent ?? (item.optimizedSize ? Math.round(((item.originalSize - item.optimizedSize) / item.originalSize) * 100) : 0);

            return (
              <div
                key={item.id}
                className="group relative bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden transition-all flex flex-col justify-between shadow-sm"
              >
                {/* Image Preview & Overlay */}
                <div
                  onClick={() => item.status === 'completed' && onCompareItem(item)}
                  className={`relative h-44 bg-neutral-950 flex items-center justify-center p-2 overflow-hidden ${
                    item.status === 'completed' ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
                    backgroundSize: '12px 12px',
                  }}
                >
                  <img
                    src={item.optimizedUrl || item.originalUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Status Overlay Tag */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1 bg-emerald-950/90 text-emerald-300 text-[11px] font-medium px-2 py-0.5 rounded border border-emerald-800/80 backdrop-blur-xs font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>-{savingsPct}%</span>
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="flex items-center gap-1 bg-amber-950/90 text-amber-300 text-[11px] font-medium px-2 py-0.5 rounded border border-amber-800/80 backdrop-blur-xs font-mono">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        <span>Processing</span>
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="flex items-center gap-1 bg-neutral-900/90 text-neutral-400 text-[11px] px-2 py-0.5 rounded border border-neutral-700 backdrop-blur-xs font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="flex items-center gap-1 bg-red-950/90 text-red-300 text-[11px] px-2 py-0.5 rounded border border-red-800 backdrop-blur-xs font-mono">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white bg-black/60 hover:bg-neutral-800 rounded transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Hover Inspect Prompt */}
                  {item.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 text-white text-xs font-medium rounded-lg border border-neutral-700 shadow-md">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Compare Before / After</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-3.5 space-y-2.5">
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-neutral-200 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-1">
                      <span>{item.originalWidth}×{item.originalHeight}</span>
                      {item.optimizedWidth && (
                        <>
                          <span>→</span>
                          <span className="text-emerald-400 font-medium">
                            {item.optimizedWidth}×{item.optimizedHeight}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Size Metrics */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-neutral-800/80">
                    <span className="text-neutral-400 tabular-nums">{originalKb} KB</span>
                    {item.status === 'completed' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500">→</span>
                        <span className="text-emerald-400 font-semibold tabular-nums">{optimizedKb} KB</span>
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-red-400 text-[11px] truncate max-w-[140px]" title={item.errorMessage}>
                        {item.errorMessage || 'Error'}
                      </span>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-1 gap-1">
                    <div className="flex items-center gap-1">
                      {item.status === 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onCompareItem(item)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                            title="Compare before/after slider"
                            aria-label="Compare photo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onGenerateCode(item)}
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-800 transition-colors"
                            title="Generate HTML <picture> / srcset code"
                            aria-label="Generate code"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => onProcessItem(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Optimize</span>
                        </button>
                      )}

                      {item.status === 'processing' && (
                        <button
                          type="button"
                          onClick={() => onCancelItem(item.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-300 hover:text-red-300 bg-neutral-800 rounded transition-colors"
                        >
                          <span>Cancel</span>
                        </button>
                      )}

                      {item.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => onRetryItem(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950 border border-amber-800 hover:bg-amber-900 rounded transition-colors"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}

                      {item.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => onDownloadItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors"
                          title="Download optimized photo"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/80 shadow-sm">
          {items.map((item) => {
            const originalKb = Math.round(item.originalSize / 1024);
            const optimizedKb = item.optimizedSize ? Math.round(item.optimizedSize / 1024) : 0;
            const savingsPct = item.savingsPercent ?? (item.optimizedSize ? Math.round(((item.originalSize - item.optimizedSize) / item.originalSize) * 100) : 0);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 hover:bg-neutral-800/30 transition-colors gap-3"
              >
                {/* Thumb + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    onClick={() => item.status === 'completed' && onCompareItem(item)}
                    className="w-12 h-12 bg-neutral-950 rounded border border-neutral-800 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.optimizedUrl || item.originalUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-neutral-200 truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-0.5">
                      <span>{item.originalWidth}×{item.originalHeight}</span>
                      {item.optimizedWidth && (
                        <>
                          <span>→</span>
                          <span className="text-emerald-400">{item.optimizedWidth}×{item.optimizedHeight}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <span className="text-neutral-400 block tabular-nums">{originalKb} KB</span>
                    {item.status === 'completed' && (
                      <span className="text-emerald-400 font-semibold block tabular-nums">
                        {optimizedKb} KB (-{savingsPct}%)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {item.status === 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onCompareItem(item)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Compare"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onGenerateCode(item)}
                          className="p-1.5 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-800 transition-colors"
                          title="Srcset code"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadItem(item)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </>
                    )}

                    {item.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onProcessItem(item.id)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors"
                      >
                        Optimize
                      </button>
                    )}

                    {item.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => onRetryItem(item.id)}
                        className="px-2 py-1 text-xs font-medium text-amber-300 bg-amber-950 rounded transition-colors"
                      >
                        Retry
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
