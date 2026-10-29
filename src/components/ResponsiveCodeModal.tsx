import React, { useState } from 'react';
import { ImageItem } from '../types';
import { X, Copy, Check, Code, Layers } from 'lucide-react';

interface ResponsiveCodeModalProps {
  item: ImageItem | null;
  onClose: () => void;
}

export const ResponsiveCodeModal: React.FC<ResponsiveCodeModalProps> = ({ item, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [markupType, setMarkupType] = useState<'picture' | 'srcset'>('picture');
  const [altText, setAltText] = useState<string>(item ? item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Product Photo');

  if (!item) return null;

  const baseFilename = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const ext = item.optimizedFormat || 'webp';

  const widths = [480, 800, 1200, 1600].filter(w => w <= (item.originalWidth || 2000));
  if (widths.length === 0) widths.push(item.optimizedWidth || 800);

  const srcsetWebP = widths.map(w => `/images/${baseFilename}-${w}w.webp ${w}w`).join(',\n      ');
  const srcsetAvif = widths.map(w => `/images/${baseFilename}-${w}w.avif ${w}w`).join(',\n      ');
  const defaultFallback = `/images/${baseFilename}-${widths[Math.min(1, widths.length - 1)]}w.${ext}`;

  const pictureSnippet = `<!-- High-Performance Responsive E-Commerce Product Image -->
<picture>
  <!-- Next-gen AVIF for supported modern browsers -->
  <source
    type="image/avif"
    srcset="
      ${srcsetAvif}
    "
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  />
  <!-- Standard WebP with multi-DPI srcset -->
  <source
    type="image/webp"
    srcset="
      ${srcsetWebP}
    "
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  />
  <!-- Fallback image with dimensions and async decoding -->
  <img
    src="${defaultFallback}"
    alt="${altText}"
    width="${item.optimizedWidth || 800}"
    height="${item.optimizedHeight || 800}"
    loading="lazy"
    decoding="async"
    class="w-full h-auto object-cover rounded-lg"
  />
</picture>`;

  const imgSnippet = `<!-- Responsive <img> with srcset and async loading -->
<img
  src="${defaultFallback}"
  srcset="
    ${srcsetWebP}
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="${altText}"
  width="${item.optimizedWidth || 800}"
  height="${item.optimizedHeight || 800}"
  loading="lazy"
  decoding="async"
  class="w-full h-auto object-contain"
/>`;

  const codeToShow = markupType === 'picture' ? pictureSnippet : imgSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeToShow);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Responsive Image Markup Generator"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-100">
              Responsive Web Markup & Srcset Snippet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Markup Choice */}
            <div className="flex items-center gap-1 p-1 bg-neutral-800/80 rounded-lg border border-neutral-700/50">
              <button
                type="button"
                onClick={() => setMarkupType('picture')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  markupType === 'picture' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                &lt;picture&gt; (AVIF + WebP)
              </button>
              <button
                type="button"
                onClick={() => setMarkupType('srcset')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  markupType === 'srcset' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                &lt;img srcset&gt;
              </button>
            </div>

            {/* Alt Text Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <label htmlFor="alt-input" className="text-xs text-neutral-400 whitespace-nowrap">Alt Text:</label>
              <input
                id="alt-input"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Product description for SEO..."
                className="w-full px-2.5 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Code box */}
          <div className="relative group">
            <pre className="p-4 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-900/60">
              <code>{codeToShow}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-md shadow-md transition-colors border border-neutral-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-neutral-400 bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-normal">
              This snippet includes automatic lazy-loading, asynchronous decoding, responsive srcset breakpoints, and fallback dimensions to avoid Cumulative Layout Shift (CLS) in Core Web Vitals.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
