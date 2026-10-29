import React, { useState, useMemo } from 'react';
import { ImageItem, OutputFormat } from '../types';
import { formatFilename, transformFilenameTemplate } from '../utils/filename';
import { 
  X, 
  Check, 
  Sparkles, 
  FileEdit, 
  ArrowRight, 
  AlertCircle, 
  Code2, 
  Wand2, 
  RefreshCw 
} from 'lucide-react';

interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ImageItem[];
  currentTemplate: string;
  defaultFormat: OutputFormat;
  defaultQuality: number;
  presetName: string;
  onApply: (newTemplate: string, updatedItems: { id: string; newName: string }[]) => void;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  onClose,
  items,
  currentTemplate,
  defaultFormat,
  defaultQuality,
  presetName,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<'replace' | 'builder'>('replace');
  
  // Search & Replace state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [isRegex, setIsRegex] = useState<boolean>(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(false);

  // Direct Template Rule Builder state
  const [customTemplate, setCustomTemplate] = useState<string>(currentTemplate);
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [caseFormat, setCaseFormat] = useState<'none' | 'lower' | 'upper'>('none');

  // Compute calculated target template based on active mode
  const { computedTemplate, regexError } = useMemo(() => {
    if (activeTab === 'replace') {
      if (!searchQuery) {
        return { computedTemplate: currentTemplate, regexError: undefined };
      }
      const res = transformFilenameTemplate(
        currentTemplate,
        searchQuery,
        replaceQuery,
        isRegex,
        isCaseSensitive
      );
      return {
        computedTemplate: res.newTemplate,
        regexError: res.error,
      };
    } else {
      let templ = customTemplate;
      if (prefix) templ = `${prefix}${templ}`;
      if (suffix) {
        // insert suffix before .{ext} if present
        if (templ.includes('.{ext}')) {
          templ = templ.replace('.{ext}', `${suffix}.{ext}`);
        } else {
          templ = `${templ}${suffix}`;
        }
      }
      return { computedTemplate: templ, regexError: undefined };
    }
  }, [
    activeTab,
    currentTemplate,
    searchQuery,
    replaceQuery,
    isRegex,
    isCaseSensitive,
    customTemplate,
    prefix,
    suffix,
  ]);

  // Preview generated names for existing items in list
  const previewItems = useMemo(() => {
    return items.map((it, idx) => {
      const currentName = it.optimizedName || formatFilename(currentTemplate, {
        originalName: it.name,
        width: it.optimizedWidth || it.originalWidth || 800,
        height: it.optimizedHeight || it.originalHeight || 800,
        format: it.optimizedFormat || defaultFormat,
        quality: it.savingsPercent ? 80 : defaultQuality,
        presetName,
        index: idx,
      });

      let nextName = formatFilename(computedTemplate, {
        originalName: it.name,
        width: it.optimizedWidth || it.originalWidth || 800,
        height: it.optimizedHeight || it.originalHeight || 800,
        format: it.optimizedFormat || defaultFormat,
        quality: it.savingsPercent ? 80 : defaultQuality,
        presetName,
        index: idx,
      });

      if (caseFormat === 'lower') {
        const lastDot = nextName.lastIndexOf('.');
        if (lastDot > 0) {
          nextName = nextName.substring(0, lastDot).toLowerCase() + nextName.substring(lastDot);
        } else {
          nextName = nextName.toLowerCase();
        }
      } else if (caseFormat === 'upper') {
        const lastDot = nextName.lastIndexOf('.');
        if (lastDot > 0) {
          nextName = nextName.substring(0, lastDot).toUpperCase() + nextName.substring(lastDot);
        } else {
          nextName = nextName.toUpperCase();
        }
      }

      return {
        id: it.id,
        originalName: it.name,
        currentName,
        nextName,
        changed: currentName !== nextName,
      };
    });
  }, [
    items,
    currentTemplate,
    computedTemplate,
    defaultFormat,
    defaultQuality,
    presetName,
    caseFormat,
  ]);

  const handleApply = () => {
    if (regexError) return;
    const updates = previewItems.map((p) => ({
      id: p.id,
      newName: p.nextName,
    }));
    onApply(computedTemplate, updates);
    onClose();
  };

  const applyPresetRegex = (search: string, replace: string, regexMode: boolean) => {
    setSearchQuery(search);
    setReplaceQuery(replace);
    setIsRegex(regexMode);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Batch Rename and Regex Pattern Tool"
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Batch Filename Transformer</span>
                <span className="text-neutral-500 font-normal text-xs font-mono">
                  ({items.length} {items.length === 1 ? 'item' : 'items'} in queue)
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-neutral-800 bg-neutral-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'replace'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Search & Replace / Regex Pattern
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'builder'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pattern Rule Builder
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* TAB 1: Search & Replace / Regex */}
          {activeTab === 'replace' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Search Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="search-input" className="text-xs text-neutral-300 font-medium">Search for:</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsRegex(!isRegex)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                          isRegex
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Toggle regular expressions mode"
                      >
                        .* Regex
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                          isCaseSensitive
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                        title="Match case"
                      >
                        Aa Match Case
                      </button>
                    </div>
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRegex ? 'e.g. -opt|-shopify or (\\d+)w' : 'e.g. shopify or opt'}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Replace Field */}
                <div>
                  <label htmlFor="replace-input" className="block text-xs text-neutral-300 font-medium mb-1">Replace with:</label>
                  <input
                    id="replace-input"
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="e.g. hero, amazon, or custom text"
                    className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Regex Error Alert if any */}
              {regexError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-950/60 border border-red-800 text-xs text-red-300 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Invalid regular expression: {regexError}</span>
                </div>
              )}

              {/* Quick Regex Presets Strip */}
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                <span className="block text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Common Quick Presets:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetRegex('shopify', 'amazon', false)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                  >
                    Replace "shopify" → "amazon"
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetRegex('-\\d+w', '', true)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                  >
                    Strip Width Suffix (-\d+w)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetRegex('\\{name\\}', '{n}-{name}', true)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                  >
                    Add Number Prefix ({'{n}'})
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetRegex('\\{name\\}', 'SKU-{n}', true)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                  >
                    SKU Numbering (SKU-{'{n}'})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setReplaceQuery(''); }}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded border border-neutral-800 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pattern Rule Builder */}
          {activeTab === 'builder' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="pattern-input" className="block text-xs text-neutral-300 font-medium mb-1">
                  Master Filename Pattern
                </label>
                <input
                  id="pattern-input"
                  type="text"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tokens */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{name}', desc: 'Original Clean Name' },
                  { tag: '{width}', desc: 'Width' },
                  { tag: '{height}', desc: 'Height' },
                  { tag: '{ext}', desc: 'Extension' },
                  { tag: '{quality}', desc: 'Quality' },
                  { tag: '{preset}', desc: 'Preset' },
                  { tag: '{n}', desc: '01, 02...' },
                  { tag: '{index}', desc: '1, 2...' },
                ].map((token) => (
                  <button
                    key={token.tag}
                    type="button"
                    onClick={() => {
                      if (!customTemplate.includes(token.tag)) {
                        setCustomTemplate((prev) => prev.replace('.{ext}', `-${token.tag}.{ext}`));
                      }
                    }}
                    className="px-2 py-0.5 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                  >
                    + {token.tag}
                  </button>
                ))}
              </div>

              {/* Affixes & Casing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
                <div>
                  <label htmlFor="prefix-input" className="block text-xs text-neutral-400 mb-1">Add Prefix</label>
                  <input
                    id="prefix-input"
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. 2026- or PROD-"
                    className="w-full px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="suffix-input" className="block text-xs text-neutral-400 mb-1">Add Suffix</label>
                  <input
                    id="suffix-input"
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. -opt or @2x"
                    className="w-full px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="casing-select" className="block text-xs text-neutral-400 mb-1">Letter Casing</label>
                  <select
                    id="casing-select"
                    value={caseFormat}
                    onChange={(e) => setCaseFormat(e.target.value as any)}
                    className="w-full px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">As-is</option>
                    <option value="lower">lowercase (recommended for web)</option>
                    <option value="upper">UPPERCASE</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Current vs Target Template Banner */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                Target Output Template
              </span>
              <span className="font-mono text-emerald-400 font-medium break-all">
                {computedTemplate}
              </span>
            </div>
            <div className="text-right sm:text-right shrink-0">
              <span className="text-[11px] font-mono text-neutral-400">
                {previewItems.filter(p => p.changed).length} of {previewItems.length} files modified
              </span>
            </div>
          </div>

          {/* Live Preview Comparison Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-200 block">
              Live Queue Renaming Preview
            </span>
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 font-medium">#</th>
                    <th className="py-2 px-3 font-medium">Original Filename</th>
                    <th className="py-2 px-3 font-medium">Current Target</th>
                    <th className="py-2 px-3 font-medium">New Renamed Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {previewItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-500 font-sans text-xs">
                        No photos in queue yet. Add photos or load samples to preview rename output.
                      </td>
                    </tr>
                  ) : (
                    previewItems.slice(0, 8).map((p, idx) => (
                      <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-2 px-3 text-neutral-600">{idx + 1}</td>
                        <td className="py-2 px-3 text-neutral-400 truncate max-w-[160px]" title={p.originalName}>
                          {p.originalName}
                        </td>
                        <td className="py-2 px-3 text-neutral-400 truncate max-w-[200px]" title={p.currentName}>
                          {p.currentName}
                        </td>
                        <td className="py-2 px-3 truncate max-w-[220px]" title={p.nextName}>
                          <span className={p.changed ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                            {p.nextName}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {previewItems.length > 8 && (
                <div className="py-1.5 px-3 bg-neutral-900/50 border-t border-neutral-800 text-[11px] text-neutral-500 text-center font-mono">
                  + {previewItems.length - 8} more items in batch will also be renamed
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={Boolean(regexError)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Rename to All ({previewItems.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
