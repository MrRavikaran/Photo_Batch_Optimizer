import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FolderArchive, ArrowUpRight } from 'lucide-react';
import { SAMPLE_PRODUCTS, createSampleProductFile } from '../utils/sampleImages';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isLoadingSamples?: boolean;
  onLoadSamples: () => void;
  hasFiles: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesAdded,
  isLoadingSamples = false,
  onLoadSamples,
  hasFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler to paste images directly from clipboard (e.g. screenshots or copied product photos)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        onFilesAdded(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|avif|bmp|gif|tiff)$/i.test(file.name)) {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesAdded(files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
        isDragOver
          ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.15)] scale-[1.005]'
          : hasFiles
          ? 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60'
          : 'border-neutral-700 bg-neutral-900/70 hover:border-neutral-600 hover:bg-neutral-900 py-12 px-6'
      } ${hasFiles ? 'py-4 px-4 sm:px-6' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.webp,.png,.jpg,.jpeg,.avif"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload product photos"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-sm font-semibold text-neutral-100">
                {isDragOver ? 'Drop product photos here' : 'Drop product photos here or browse'}
              </span>
              <span className="hidden md:inline-block text-[11px] text-neutral-400 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">
                Ctrl+V to Paste
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Supports JPEG, PNG, WebP, AVIF · 100% private in-browser client side (no server upload)
            </p>
          </div>
        </div>

        {/* Action Button: Load Samples */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            title="Load sample watch, headphones, sneakers, and perfume photos"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLoadingSamples ? 'Generating Samples...' : 'Load Sample Products'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
