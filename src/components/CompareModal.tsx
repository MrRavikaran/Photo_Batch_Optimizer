import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageItem } from '../types';
import { X, ZoomIn, ZoomOut, RotateCcw, Columns2, SplitSquareVertical, Sparkles } from 'lucide-react';

interface CompareModalProps {
  item: ImageItem | null;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ item, onClose }) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setSliderPos((prev) => Math.max(0, prev - (e.shiftKey ? 10 : 2)));
      } else if (e.key === 'ArrowRight') {
        setSliderPos((prev) => Math.min(100, prev + (e.shiftKey ? 10 : 2)));
      } else if (e.key === 'Home') {
        setSliderPos(0);
      } else if (e.key === 'End') {
        setSliderPos(100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateSliderFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomLevel > 1 && e.button === 0 && !e.shiftKey && (e.target as HTMLElement).tagName !== 'INPUT') {
      // Pan mode
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }
    setIsDragging(true);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }
    if (isDragging) {
      updateSliderFromClientX(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  if (!item) return null;

  const originalSizeMb = (item.originalSize / (1024 * 1024)).toFixed(2);
  const optimizedSizeMb = item.optimizedSize ? (item.optimizedSize / (1024 * 1024)).toFixed(2) : '0.00';
  const originalSizeKb = Math.round(item.originalSize / 1024);
  const optimizedSizeKb = item.optimizedSize ? Math.round(item.optimizedSize / 1024) : 0;
  const savingsKb = originalSizeKb - optimizedSizeKb;
  const savingsPct = item.savingsPercent ?? (item.optimizedSize ? Math.round(((item.originalSize - item.optimizedSize) / item.originalSize) * 100) : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Before and After Photo Quality Comparison"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-semibold text-sm sm:text-base text-neutral-100 truncate">
              {item.name}
            </span>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span>{item.originalWidth}×{item.originalHeight}px</span>
              <span aria-hidden="true">→</span>
              <span className="text-emerald-400 font-medium">
                {item.optimizedWidth}×{item.optimizedHeight}px
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700/50">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                title="Split Slider"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'split' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                title="Side by Side"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Side-by-Side</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700/50">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-mono text-neutral-300 tabular-nums">
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
                disabled={zoomLevel >= 4}
                className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                  title="Reset Zoom"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="relative flex-1 bg-neutral-950 overflow-hidden select-none cursor-ew-resize flex items-center justify-center p-2"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            cursor: zoomLevel > 1 && isPanning ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'ew-resize'
          }}
        >
          {viewMode === 'split' ? (
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transition: isPanning ? 'none' : 'transform 100ms ease-out',
              }}
            >
              {/* Optimized Image (Base Layer) */}
              <img
                src={item.optimizedUrl || item.originalUrl}
                alt="Optimized product photo"
                className="max-w-[85vw] max-h-[70vh] object-contain rounded pointer-events-none"
              />

              {/* Original Image (Clipped Overlay Layer) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(0% 0%, ${sliderPos}% 0%, ${sliderPos}% 100%, 0% 100%)`,
                }}
              >
                <img
                  src={item.originalUrl}
                  alt="Original product photo"
                  className="w-full h-full object-contain rounded"
                />
              </div>

              {/* Slider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] -translate-x-1/2" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-neutral-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-[11px] font-bold">
                  ↔
                </div>
              </div>

              {/* Labels on Canvas */}
              <div className="absolute top-3 left-3 pointer-events-none bg-black/70 backdrop-blur-sm text-neutral-200 text-xs px-2.5 py-1 rounded border border-neutral-700/60 font-medium">
                Original ({originalSizeKb} KB)
              </div>
              <div className="absolute top-3 right-3 pointer-events-none bg-black/70 backdrop-blur-sm text-emerald-300 text-xs px-2.5 py-1 rounded border border-emerald-900/60 font-medium">
                Optimized ({optimizedSizeKb} KB)
              </div>
            </div>
          ) : (
            // Side-by-Side Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4 items-center">
              <div className="flex flex-col items-center justify-center h-full bg-neutral-900/50 rounded-lg p-2 border border-neutral-800">
                <span className="text-xs text-neutral-400 mb-2 font-mono">
                  Original: {item.originalWidth}×{item.originalHeight}px · {originalSizeKb} KB
                </span>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.originalUrl}
                    alt="Original"
                    className="max-w-full max-h-[62vh] object-contain rounded"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center h-full bg-neutral-900/50 rounded-lg p-2 border border-emerald-900/30">
                <span className="text-xs text-emerald-400 mb-2 font-mono">
                  Optimized: {item.optimizedWidth}×{item.optimizedHeight}px · {optimizedSizeKb} KB ({savingsPct}% smaller)
                </span>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.optimizedUrl || item.originalUrl}
                    alt="Optimized"
                    className="max-w-full max-h-[62vh] object-contain rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Metrics & Slider Control */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs text-neutral-300">
          {/* Slider input for accessibility */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-neutral-400 text-xs whitespace-nowrap">Compare Position:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Comparison slider percentage"
              className="w-40 sm:w-56 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="font-mono text-neutral-400 tabular-nums w-10">{Math.round(sliderPos)}%</span>
          </div>

          {/* Savings Metric Chips */}
          <div className="flex items-center gap-3 sm:gap-6 font-mono">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">Before</span>
              <span className="text-neutral-200 font-medium tabular-nums">{originalSizeMb} MB</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">After</span>
              <span className="text-emerald-400 font-semibold tabular-nums">{optimizedSizeMb} MB</span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded">
              <span className="text-emerald-400 font-bold tabular-nums">
                -{savingsPct}% ({savingsKb} KB saved)
              </span>
            </div>
            {item.ssimScore && (
              <div className="hidden lg:flex items-center gap-1.5 text-neutral-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SSIM: <strong className="text-white font-medium">{item.ssimScore}</strong></span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
