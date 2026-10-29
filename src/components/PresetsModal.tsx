import React from 'react';
import { Preset } from '../types';
import { X, Check, ShoppingBag, ShieldCheck, Zap, Info } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Preset[];
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  currentPresetId,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="E-Commerce Photo Guidelines & Presets"
    >
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-100">
              E-Commerce Platform Photo Standards & Presets
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
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Zap className="w-4 h-4" />
              <span>Conversion & Performance Optimization</span>
            </div>
            <p>
              Heavy photos account for up to 75% of total page weight on product detail pages. Using modern WebP formats and proper resolutions speeds up mobile load times by 3-5x, dramatically decreasing bounce rates and improving Google Search ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presets.map((preset) => {
              const isSelected = preset.id === currentPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-neutral-100">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-normal mb-3">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-800/80">
                    <span>{preset.maxWidth}×{preset.maxHeight} px</span>
                    <span className="uppercase text-emerald-400 font-medium">
                      {preset.format} · {preset.quality}% Q
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-200 block mb-0.5">100% In-Browser Zero Upload Privacy</strong>
              <p className="leading-normal">
                Your high-resolution product photos, unreleased merchandise, and commercial assets are processed exclusively within your device's browser memory via Web Workers and OffscreenCanvas. No data is transmitted to external servers.
              </p>
            </div>
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
