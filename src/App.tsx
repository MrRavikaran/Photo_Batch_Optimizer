import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ImageItem, 
  OptimizationSettings, 
  Preset, 
  BatchStats 
} from './types';
import { DEFAULT_PRESETS, loadSavedPresets } from './data/presets';
import { globalWorkerPool } from './utils/workerPool';
import { formatFilename } from './utils/filename';
import { createZipBlob } from './utils/zip';
import { SAMPLE_PRODUCTS, createSampleProductFile } from './utils/sampleImages';
import { TopNav } from './components/TopNav';
import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsBar } from './components/StatsBar';
import { FileList } from './components/FileList';
import { CompareModal } from './components/CompareModal';
import { ResponsiveCodeModal } from './components/ResponsiveCodeModal';
import { PresetsModal } from './components/PresetsModal';
import { BatchRenameModal } from './components/BatchRenameModal';

export default function App() {
  const [presets] = useState<Preset[]>(loadSavedPresets());
  const [settings, setSettings] = useState<OptimizationSettings>({
    presetId: 'shopify-listing',
    maxWidth: 1000,
    maxHeight: 1000,
    maintainAspectRatio: true,
    fit: 'contain',
    format: 'webp',
    quality: 80,
    autoQuality: false,
    targetSimilarity: 0.94,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-shopify-{width}w.{ext}',
    watermark: {
      enabled: false,
      type: 'text',
      text: 'STORE BRAND',
      fontFamily: 'sans-serif',
      fontSize: 24,
      color: '#ffffff',
      opacity: 50,
      position: 'bottom-right',
    },
    filters: {
      enabled: false,
      grayscale: 0,
      sepia: 0,
      autoContrast: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sharpen: false,
    },
  });

  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [concurrency, setConcurrency] = useState<number>(globalWorkerPool.getConcurrency());
  
  // Modals state
  const [comparingItem, setComparingItem] = useState<ImageItem | null>(null);
  const [codeSnippetItem, setCodeSnippetItem] = useState<ImageItem | null>(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);

  // Theme state: dark / light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('batch_optimizer_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('batch_optimizer_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active abort controllers for individual tasks
  const abortControllersRef = React.useRef<Map<string, AbortController>>(new Map());

  // Check File System Access API support
  const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const handleConcurrencyChange = (newVal: number) => {
    setConcurrency(newVal);
    globalWorkerPool.setConcurrency(newVal);
  };

  // Helper to add files with metadata extraction
  const addFiles = useCallback(async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const objectUrl = URL.createObjectURL(file);

      // Extract image dimensions
      let width = 0;
      let height = 0;
      try {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      } catch {
        // Fallback to Image element
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = objectUrl;
        });
      }

      newItems.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: width || 800,
        originalHeight: height || 800,
        originalUrl: objectUrl,
        originalType: file.type,
        status: 'pending',
        progress: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Load procedural rich sample products
  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      const sampleFiles: File[] = [];
      for (const sample of SAMPLE_PRODUCTS) {
        const file = await createSampleProductFile(sample);
        sampleFiles.push(file);
      }
      await addFiles(sampleFiles);
    } catch (err) {
      console.error('Failed to load sample products', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Process a single item
  const processItem = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: 'processing', progress: 10, errorMessage: undefined } : it))
    );

    const currentItem = items.find((it) => it.id === itemId);
    if (!currentItem) return;

    const startTime = performance.now();

    const abortController = globalWorkerPool.enqueue(
      itemId,
      currentItem.file,
      settings,
      {
        onSuccess: (output) => {
          const elapsed = Math.round(performance.now() - startTime);
          const optimizedUrl = URL.createObjectURL(output.blob);
          const outName = formatFilename(settings.filenameTemplate, {
            originalName: currentItem.name,
            width: output.width,
            height: output.height,
            format: output.format,
            quality: output.qualityUsed ?? settings.quality,
            presetName: settings.presetId,
            index: items.findIndex((it) => it.id === itemId),
          });

          const savings = currentItem.originalSize - output.size;
          const savingsPct = Math.round((savings / currentItem.originalSize) * 100);

          setItems((prev) =>
            prev.map((it) => {
              if (it.id === itemId) {
                // Free previous blob url if exists
                if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);

                return {
                  ...it,
                  status: 'completed',
                  progress: 100,
                  optimizedBlob: output.blob,
                  optimizedUrl,
                  optimizedSize: output.size,
                  optimizedWidth: output.width,
                  optimizedHeight: output.height,
                  optimizedName: outName,
                  optimizedFormat: output.format,
                  savingsBytes: savings,
                  savingsPercent: savingsPct,
                  processingTimeMs: elapsed,
                  ssimScore: output.ssimScore,
                };
              }
              return it;
            })
          );
        },
        onError: (err) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId ? { ...it, status: 'failed', errorMessage: err, progress: 0 } : it
            )
          );
        },
      }
    );

    abortControllersRef.current.set(itemId, abortController);
  }, [items, settings]);

  // Process all pending or failed items
  const handleProcessAll = () => {
    setIsProcessingBatch(true);
    const toProcess = items.filter((it) => it.status === 'pending' || it.status === 'failed');
    toProcess.forEach((it) => {
      processItem(it.id);
    });
  };

  // Monitor batch completion
  useEffect(() => {
    if (!isProcessingBatch) return;
    const isAnyActive = items.some((it) => it.status === 'processing');
    if (!isAnyActive) {
      setIsProcessingBatch(false);
    }
  }, [items, isProcessingBatch]);

  // Cancel single item
  const handleCancelItem = (itemId: string) => {
    globalWorkerPool.cancelTask(itemId);
    const controller = abortControllersRef.current.get(itemId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(itemId);
    }
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: 'cancelled', progress: 0 } : it))
    );
  };

  // Cancel all
  const handleCancelAll = () => {
    globalWorkerPool.clearQueue();
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current.clear();
    setItems((prev) =>
      prev.map((it) => (it.status === 'processing' ? { ...it, status: 'cancelled' } : it))
    );
    setIsProcessingBatch(false);
  };

  // Remove single item and free memory
  const handleRemoveItem = (itemId: string) => {
    handleCancelItem(itemId);
    setItems((prev) => {
      const target = prev.find((it) => it.id === itemId);
      if (target) {
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
        if (target.optimizedUrl) URL.revokeObjectURL(target.optimizedUrl);
      }
      return prev.filter((it) => it.id !== itemId);
    });
  };

  // Clear all completed
  const handleClearCompleted = () => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (it.status === 'completed') {
          if (it.originalUrl) URL.revokeObjectURL(it.originalUrl);
          if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);
        }
      });
      return prev.filter((it) => it.status !== 'completed');
    });
  };

  // Clear all queue
  const handleClearAll = () => {
    handleCancelAll();
    items.forEach((it) => {
      if (it.originalUrl) URL.revokeObjectURL(it.originalUrl);
      if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);
    });
    setItems([]);
  };

  // Single file download
  const handleDownloadItem = (item: ImageItem) => {
    if (!item.optimizedBlob) return;
    const a = document.createElement('a');
    a.href = item.optimizedUrl || URL.createObjectURL(item.optimizedBlob);
    a.download = item.optimizedName || `optimized-${item.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handcrafted ZIP download (zero external dependencies!)
  const handleDownloadZip = async () => {
    const completedItems = items.filter((it) => it.status === 'completed' && it.optimizedBlob);
    if (completedItems.length === 0) return;

    try {
      const filesForZip = completedItems.map((it, idx) => ({
        name: it.optimizedName || formatFilename(settings.filenameTemplate, {
          originalName: it.name,
          width: it.optimizedWidth || 800,
          height: it.optimizedHeight || 800,
          format: it.optimizedFormat || 'webp',
          quality: settings.quality,
          presetName: settings.presetId,
          index: idx,
        }),
        blob: it.optimizedBlob!,
      }));

      const zipBlob = await createZipBlob(filesForZip);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-products-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    }
  };

  // File System Access API: Save All to Folder (Chromium)
  const handleSaveToFolder = async () => {
    const completedItems = items.filter((it) => it.status === 'completed' && it.optimizedBlob);
    if (completedItems.length === 0) return;

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });

      for (const it of completedItems) {
        const filename = it.optimizedName || `optimized-${it.name}`;
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(it.optimizedBlob);
        await writable.close();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Folder save error:', err);
      }
    }
  };

  // Global Keyboard Shortcuts
  // Ctrl+Enter: Process All
  // Ctrl+S: Download ZIP
  // Ctrl+Delete: Clear All
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. Ctrl+Enter -> Process All
      if (isCtrlOrCmd && e.key === 'Enter') {
        const hasPending = items.some((it) => it.status === 'pending' || it.status === 'failed');
        if (hasPending && !isProcessingBatch) {
          e.preventDefault();
          handleProcessAll();
        }
        return;
      }

      // 2. Ctrl+S -> Download ZIP
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault(); // Prevent browser default HTML Save As dialog
        const hasCompleted = items.some((it) => it.status === 'completed' && it.optimizedBlob);
        if (hasCompleted && !isProcessingBatch) {
          handleDownloadZip();
        }
        return;
      }

      // 3. Ctrl+Delete or Ctrl+Backspace -> Clear All
      if (isCtrlOrCmd && (e.key === 'Delete' || e.key === 'Backspace')) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        if (items.length > 0 && !isProcessingBatch) {
          e.preventDefault();
          handleClearAll();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [items, isProcessingBatch, settings]);

  // Batch Rename Handler
  const handleApplyBatchRename = (
    newTemplate: string,
    updatedItems: { id: string; newName: string }[]
  ) => {
    setSettings((prev) => ({
      ...prev,
      filenameTemplate: newTemplate,
      presetId: 'custom',
    }));

    const nameMap = new Map(updatedItems.map((u) => [u.id, u.newName]));
    setItems((prev) =>
      prev.map((it) => {
        const newName = nameMap.get(it.id);
        if (newName) {
          return {
            ...it,
            optimizedName: newName,
          };
        }
        return it;
      })
    );
  };

  // Batch stats calculation
  const stats: BatchStats = useMemo(() => {
    let originalBytes = 0;
    let optimizedBytes = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let completedCount = 0;
    let failedCount = 0;

    items.forEach((it) => {
      originalBytes += it.originalSize;
      if (it.status === 'completed' && it.optimizedSize) {
        optimizedBytes += it.optimizedSize;
        completedCount++;
      } else {
        optimizedBytes += it.originalSize;
      }

      if (it.status === 'pending') pendingCount++;
      if (it.status === 'processing') processingCount++;
      if (it.status === 'failed') failedCount++;
    });

    const savedBytes = Math.max(0, originalBytes - optimizedBytes);
    const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;

    return {
      totalCount: items.length,
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      originalBytes,
      optimizedBytes,
      savedBytes,
      savedPercent,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      
      {/* Top Bar adhering to Top Bar Contract */}
      <TopNav
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenPrivacy={() => setIsPresetsOpen(true)}
        onExportAll={handleDownloadZip}
        isProcessing={isProcessingBatch}
        completedCount={stats.completedCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area: Responsive Grid Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Drop Zone Header Banner */}
        <DropZone
          onFilesAdded={addFiles}
          isLoadingSamples={isLoadingSamples}
          onLoadSamples={handleLoadSamples}
          hasFiles={items.length > 0}
        />

        {/* Global Stats & Batch Actions Bar */}
        {items.length > 0 && (
          <StatsBar
            stats={stats}
            isProcessing={isProcessingBatch}
            onProcessAll={handleProcessAll}
            onCancelAll={handleCancelAll}
            onClearCompleted={handleClearCompleted}
            onClearAll={handleClearAll}
            onDownloadZip={handleDownloadZip}
            onSaveToFolder={handleSaveToFolder}
            onOpenBatchRename={() => setIsRenameModalOpen(true)}
            supportsDirectoryPicker={supportsDirectoryPicker}
          />
        )}

        {/* 2-Column Responsive Workspace: Settings (Left) + File List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Settings Panel Column (4 cols on desktop) */}
          <div className="lg:col-span-4 sticky top-20">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              presets={presets}
              concurrency={concurrency}
              onConcurrencyChange={handleConcurrencyChange}
              onOpenBatchRename={() => setIsRenameModalOpen(true)}
            />
          </div>

          {/* Queue & Photo Gallery Column (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            {items.length === 0 ? (
              <div className="border border-neutral-800/80 bg-neutral-900/40 rounded-xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 mx-auto flex items-center justify-center text-neutral-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-neutral-200">
                    No product photos added yet
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Drag and drop your raw product photos above, paste directly from clipboard, or click below to load high-res e-commerce test samples.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  disabled={isLoadingSamples}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <span>{isLoadingSamples ? 'Generating...' : 'Load Sample Watch, Headphones & Perfume'}</span>
                </button>
              </div>
            ) : (
              <FileList
                items={items}
                onProcessItem={processItem}
                onCancelItem={handleCancelItem}
                onRetryItem={processItem}
                onRemoveItem={handleRemoveItem}
                onCompareItem={(item) => setComparingItem(item)}
                onGenerateCode={(item) => setCodeSnippetItem(item)}
                onDownloadItem={handleDownloadItem}
              />
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 px-6 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Product Photo Batch Optimizer</span>
          <span aria-hidden="true">·</span>
          <span>Web Workers & OffscreenCanvas</span>
          <span aria-hidden="true">·</span>
          <span>100% In-Browser</span>
        </div>
        <div>
          <span>Multi-Threaded E-Commerce Optimization</span>
        </div>
      </footer>

      {/* Accessible Before / After Comparison Modal */}
      {comparingItem && (
        <CompareModal
          item={comparingItem}
          onClose={() => setComparingItem(null)}
        />
      )}

      {/* Responsive Srcset & Picture Code Snippet Modal */}
      {codeSnippetItem && (
        <ResponsiveCodeModal
          item={codeSnippetItem}
          onClose={() => setCodeSnippetItem(null)}
        />
      )}

      {/* Presets & Guidelines Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        presets={presets}
        currentPresetId={settings.presetId}
        onSelectPreset={(pId) => {
          const selected = presets.find((p) => p.id === pId);
          if (selected) {
            setSettings((prev) => ({
              ...prev,
              presetId: selected.id,
              maxWidth: selected.maxWidth,
              maxHeight: selected.maxHeight,
              fit: selected.fit,
              format: selected.format,
              quality: selected.quality,
              autoQuality: selected.autoQuality,
              keepPngTransparency: selected.keepPngTransparency,
              backgroundColor: selected.backgroundColor,
              stripMetadata: selected.stripMetadata,
              filenameTemplate: selected.filenameTemplate,
            }));
          }
        }}
      />

      {/* Batch Rename & Regex Pattern Modal */}
      <BatchRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        items={items}
        currentTemplate={settings.filenameTemplate}
        defaultFormat={settings.format}
        defaultQuality={settings.quality}
        presetName={settings.presetId}
        onApply={handleApplyBatchRename}
      />

    </div>
  );
}
