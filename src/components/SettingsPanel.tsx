import React, { useState } from 'react';
import { OptimizationSettings, Preset, OutputFormat, FitMode } from '../types';
import { formatFilename } from '../utils/filename';
import { 
  Cpu, 
  Sliders, 
  Type, 
  Palette, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  Wand2, 
  RotateCcw,
  SunMedium
} from 'lucide-react';

interface SettingsPanelProps {
  settings: OptimizationSettings;
  onChange: (settings: OptimizationSettings) => void;
  presets: Preset[];
  concurrency: number;
  onConcurrencyChange: (concurrency: number) => void;
  onOpenBatchRename?: () => void;
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  presets,
  concurrency,
  onConcurrencyChange,
  onOpenBatchRename,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'dimensions' | 'compression' | 'filters' | 'watermark' | 'naming'>('dimensions');

  const handlePresetSelect = (presetId: string) => {
    const selected = presets.find((p) => p.id === presetId);
    if (!selected) return;

    onChange({
      ...settings,
      presetId: selected.id,
      maxWidth: selected.maxWidth,
      maxHeight: selected.maxHeight,
      fit: selected.fit,
      format: selected.format,
      quality: selected.quality,
      autoQuality: selected.autoQuality,
      targetSimilarity: selected.targetSimilarity ?? 0.94,
      keepPngTransparency: selected.keepPngTransparency,
      backgroundColor: selected.backgroundColor,
      stripMetadata: selected.stripMetadata,
      filenameTemplate: selected.filenameTemplate,
    });
  };

  const sampleFilenamePreview = formatFilename(settings.filenameTemplate, {
    originalName: 'leather_handbag_studio.png',
    width: settings.maxWidth,
    height: settings.maxHeight,
    format: settings.format,
    quality: settings.quality,
    presetName: settings.presetId,
    index: 0,
  });

  return (
    <div className={`flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg ${className}`}>
      
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-neutral-100">Batch Settings</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>{concurrency} Cores</span>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-900/60">
        <label htmlFor="preset-select" className="block text-xs font-medium text-neutral-300 mb-1.5">
          E-Commerce Preset
        </label>
        <div className="relative">
          <select
            id="preset-select"
            value={settings.presetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full appearance-none px-3 py-2 text-xs bg-neutral-950 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 pr-8 transition-colors"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.maxWidth}×{p.maxHeight} · {p.format.toUpperCase()})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {presets.find((p) => p.id === settings.presetId)?.description && (
          <p className="mt-1.5 text-[11px] text-neutral-400 leading-normal">
            {presets.find((p) => p.id === settings.presetId)?.description}
          </p>
        )}
      </div>

      {/* Sub-tabs for Settings Navigation */}
      <div className="flex items-center px-3 pt-2 border-b border-neutral-800 bg-neutral-950/40 gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('dimensions')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'dimensions'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Dimensions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compression')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'compression'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Format & Quality
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'filters'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Filters</span>
          {settings.filters?.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('watermark')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'watermark'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Watermark
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('naming')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'naming'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Naming
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        
        {/* TAB 1: DIMENSIONS */}
        {activeTab === 'dimensions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="max-width-input" className="block text-xs text-neutral-400 mb-1">Max Width (px)</label>
                <input
                  id="max-width-input"
                  type="number"
                  min={10}
                  max={8000}
                  step={10}
                  value={settings.maxWidth}
                  onChange={(e) => onChange({ ...settings, maxWidth: Math.max(10, parseInt(e.target.value) || 100), presetId: 'custom' })}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="max-height-input" className="block text-xs text-neutral-400 mb-1">Max Height (px)</label>
                <input
                  id="max-height-input"
                  type="number"
                  min={10}
                  max={8000}
                  step={10}
                  value={settings.maxHeight}
                  onChange={(e) => onChange({ ...settings, maxHeight: Math.max(10, parseInt(e.target.value) || 100), presetId: 'custom' })}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fit-mode-select" className="block text-xs text-neutral-400 mb-1">Fit & Crop Mode</label>
              <select
                id="fit-mode-select"
                value={settings.fit}
                onChange={(e) => onChange({ ...settings, fit: e.target.value as FitMode, presetId: 'custom' })}
                className="w-full px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="inside">Proportional Scale (Inside bounds, no padding)</option>
                <option value="contain">Contain (Padded with canvas color to exact box)</option>
                <option value="cover">Cover (Center cropped to fill entire box)</option>
                <option value="fill">Fill (Stretch to exact width and height)</option>
              </select>
            </div>

            <div>
              <label htmlFor="bg-color-input" className="block text-xs text-neutral-400 mb-1">Background Fill</label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color-input"
                  type="color"
                  value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
                  onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value, presetId: 'custom' })}
                  className="w-7 h-7 rounded border border-neutral-700 bg-neutral-950 cursor-pointer p-0.5"
                  title="Choose solid color"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, backgroundColor: 'transparent', presetId: 'custom' })}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    settings.backgroundColor === 'transparent'
                      ? 'bg-neutral-800 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Transparent
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, backgroundColor: '#ffffff', presetId: 'custom' })}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    settings.backgroundColor === '#ffffff'
                      ? 'bg-neutral-800 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Pure White (#FFF)
                </button>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Pure white is recommended by Amazon & Google Shopping product standards.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: COMPRESSION & FORMAT */}
        {activeTab === 'compression' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Output Format</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['webp', 'jpeg', 'png', 'avif'] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onChange({ ...settings, format: fmt, presetId: 'custom' })}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md uppercase border transition-colors ${
                      settings.format === fmt
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Auto Quality Toggle */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-neutral-200">Smart Auto-Quality</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoQuality}
                    onChange={(e) => onChange({ ...settings, autoQuality: e.target.checked, presetId: 'custom' })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Iteratively computes SSIM perceptual similarity to find the lowest byte size without visible degradation.
              </p>
            </div>

            {/* Manual Quality Slider */}
            {!settings.autoQuality && settings.format !== 'png' && (
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-neutral-400">Quality:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={settings.quality}
                  onChange={(e) => onChange({ ...settings, quality: parseInt(e.target.value), presetId: 'custom' })}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                  <span>Smallest File (30%)</span>
                  <span>Balanced (80%)</span>
                  <span>Max (100%)</span>
                </div>
              </div>
            )}

            {/* Strip metadata checkbox */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-neutral-300">Strip EXIF / Camera Metadata</span>
              <input
                type="checkbox"
                checked={settings.stripMetadata}
                onChange={(e) => onChange({ ...settings, stripMetadata: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Apply Photo Filters</span>
                <span className="text-[11px] text-neutral-400">CSS & pixel transformations before compression</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.filters?.enabled || false}
                  onChange={(e) => onChange({
                    ...settings,
                    filters: {
                      ...(settings.filters || {
                        grayscale: 0,
                        sepia: 0,
                        autoContrast: false,
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        sharpen: false,
                      }),
                      enabled: e.target.checked,
                    },
                    presetId: 'custom',
                  })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {settings.filters?.enabled && (
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                
                {/* Filter Presets */}
                <div>
                  <span className="block text-[11px] font-medium text-neutral-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Filter Looks:</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 0,
                          sepia: 0,
                          autoContrast: false,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sharpen: false,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 transition-colors text-center truncate"
                    >
                      Natural / Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 0,
                          sepia: 0,
                          autoContrast: true,
                          brightness: 102,
                          contrast: 120,
                          saturation: 110,
                          sharpen: true,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-emerald-300 rounded border border-emerald-900/60 transition-colors text-center truncate"
                    >
                      Auto-Contrast Pop
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 100,
                          sepia: 0,
                          autoContrast: true,
                          brightness: 100,
                          contrast: 115,
                          saturation: 0,
                          sharpen: true,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-neutral-200 rounded border border-neutral-800 transition-colors text-center truncate"
                    >
                      Grayscale B&W
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 0,
                          sepia: 85,
                          autoContrast: false,
                          brightness: 102,
                          contrast: 108,
                          saturation: 100,
                          sharpen: false,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-amber-300 rounded border border-amber-900/60 transition-colors text-center truncate"
                    >
                      Warm Sepia
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 0,
                          sepia: 0,
                          autoContrast: false,
                          brightness: 105,
                          contrast: 115,
                          saturation: 140,
                          sharpen: true,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-teal-300 rounded border border-teal-900/60 transition-colors text-center truncate"
                    >
                      Vibrant Product
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...settings,
                        filters: {
                          enabled: true,
                          grayscale: 0,
                          sepia: 0,
                          autoContrast: true,
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          sharpen: true,
                        },
                        presetId: 'custom',
                      })}
                      className="py-1 px-2 text-[11px] font-medium bg-neutral-950 hover:bg-neutral-800 text-indigo-300 rounded border border-indigo-900/60 transition-colors text-center truncate"
                    >
                      Crisp Sharp
                    </button>
                  </div>
                </div>

                {/* Auto-Contrast Dynamic Range */}
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-200">Auto-Contrast (Histogram Stretch)</span>
                    <input
                      type="checkbox"
                      checked={settings.filters?.autoContrast || false}
                      onChange={(e) => onChange({
                        ...settings,
                        filters: {
                          ...settings.filters,
                          autoContrast: e.target.checked,
                        },
                        presetId: 'custom',
                      })}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Expands compressed luminance histogram to 0-255, removing dull haze and making whites pure.
                  </p>
                </div>

                {/* Grayscale Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-neutral-400">Grayscale:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChange({
                          ...settings,
                          filters: { ...settings.filters, grayscale: settings.filters.grayscale === 100 ? 0 : 100 },
                          presetId: 'custom',
                        })}
                        className="text-[10px] text-neutral-400 hover:text-emerald-400 underline font-mono"
                      >
                        {settings.filters?.grayscale === 100 ? 'Reset' : '100% B&W'}
                      </button>
                      <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                        {settings.filters?.grayscale || 0}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.filters?.grayscale || 0}
                    onChange={(e) => onChange({
                      ...settings,
                      filters: { ...settings.filters, grayscale: parseInt(e.target.value) },
                      presetId: 'custom',
                    })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Sepia Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-neutral-400">Sepia Vintage:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChange({
                          ...settings,
                          filters: { ...settings.filters, sepia: settings.filters.sepia === 100 ? 0 : 100 },
                          presetId: 'custom',
                        })}
                        className="text-[10px] text-neutral-400 hover:text-amber-400 underline font-mono"
                      >
                        {settings.filters?.sepia === 100 ? 'Reset' : '100% Sepia'}
                      </button>
                      <span className="font-mono text-amber-400 font-semibold tabular-nums">
                        {settings.filters?.sepia || 0}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.filters?.sepia || 0}
                    onChange={(e) => onChange({
                      ...settings,
                      filters: { ...settings.filters, sepia: parseInt(e.target.value) },
                      presetId: 'custom',
                    })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Brightness & Contrast Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-neutral-400">Brightness:</span>
                      <span className="font-mono text-neutral-300 tabular-nums">
                        {settings.filters?.brightness || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={settings.filters?.brightness || 100}
                      onChange={(e) => onChange({
                        ...settings,
                        filters: { ...settings.filters, brightness: parseInt(e.target.value) },
                        presetId: 'custom',
                      })}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-neutral-400">Contrast:</span>
                      <span className="font-mono text-neutral-300 tabular-nums">
                        {settings.filters?.contrast || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      value={settings.filters?.contrast || 100}
                      onChange={(e) => onChange({
                        ...settings,
                        filters: { ...settings.filters, contrast: parseInt(e.target.value) },
                        presetId: 'custom',
                      })}
                      className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-neutral-400">Color Saturation:</span>
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {settings.filters?.saturation || 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={settings.filters?.saturation || 100}
                    onChange={(e) => onChange({
                      ...settings,
                      filters: { ...settings.filters, saturation: parseInt(e.target.value) },
                      presetId: 'custom',
                    })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Unsharp Mask Sharpen */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                  <div>
                    <span className="text-xs text-neutral-300 block">Catalog Edge Sharpening</span>
                    <span className="text-[11px] text-neutral-500">Unsharp convolution mask for high-definition thumbnails</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.filters?.sharpen || false}
                    onChange={(e) => onChange({
                      ...settings,
                      filters: {
                        ...settings.filters,
                        sharpen: e.target.checked,
                      },
                      presetId: 'custom',
                    })}
                    className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: WATERMARK */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-200">Enable Brand Watermark</span>
              <input
                type="checkbox"
                checked={settings.watermark.enabled}
                onChange={(e) => onChange({
                  ...settings,
                  watermark: { ...settings.watermark, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {settings.watermark.enabled && (
              <div className="space-y-3 pt-1 border-t border-neutral-800">
                <div>
                  <label htmlFor="watermark-text-input" className="block text-xs text-neutral-400 mb-1">Watermark Text</label>
                  <input
                    id="watermark-text-input"
                    type="text"
                    value={settings.watermark.text}
                    onChange={(e) => onChange({
                      ...settings,
                      watermark: { ...settings.watermark, text: e.target.value }
                    })}
                    placeholder="e.g. © 2026 BRAND STORE"
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="watermark-position-select" className="block text-xs text-neutral-400 mb-1">Position</label>
                  <select
                    id="watermark-position-select"
                    value={settings.watermark.position}
                    onChange={(e) => onChange({
                      ...settings,
                      watermark: { ...settings.watermark, position: e.target.value as any }
                    })}
                    className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bottom-right">Bottom-Right (Standard)</option>
                    <option value="bottom-left">Bottom-Left</option>
                    <option value="center">Center Overlay</option>
                    <option value="top-right">Top-Right</option>
                    <option value="top-left">Top-Left</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-neutral-400">Opacity</span>
                    <span className="font-mono text-neutral-300">{settings.watermark.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={settings.watermark.opacity}
                    onChange={(e) => onChange({
                      ...settings,
                      watermark: { ...settings.watermark, opacity: parseInt(e.target.value) }
                    })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FILENAME TEMPLATE */}
        {activeTab === 'naming' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="filename-pattern-input" className="block text-xs text-neutral-400 mb-1">
                Filename Pattern
              </label>
              <input
                id="filename-pattern-input"
                type="text"
                value={settings.filenameTemplate}
                onChange={(e) => onChange({ ...settings, filenameTemplate: e.target.value, presetId: 'custom' })}
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Template Tokens */}
            <div>
              <span className="block text-[11px] text-neutral-400 mb-1.5">Available Tokens:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{name}', desc: 'Original name' },
                  { tag: '{width}', desc: 'Width px' },
                  { tag: '{height}', desc: 'Height px' },
                  { tag: '{ext}', desc: 'Extension' },
                  { tag: '{quality}', desc: 'Quality' },
                  { tag: '{preset}', desc: 'Preset ID' },
                  { tag: '{n}', desc: 'Index (01)' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      if (!settings.filenameTemplate.includes(item.tag)) {
                        const base = settings.filenameTemplate.replace(/\.\{ext\}$/, '');
                        onChange({
                          ...settings,
                          filenameTemplate: `${base}-${item.tag}.{ext}`,
                          presetId: 'custom',
                        });
                      }
                    }}
                    title={`Add ${item.desc}`}
                    className="px-2 py-0.5 text-[10px] font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                Sample Output Preview:
              </span>
              <p className="text-xs font-mono text-emerald-400 break-all select-all">
                {sampleFilenamePreview}
              </p>
            </div>

            {/* Launch Batch Rename Tool */}
            {onOpenBatchRename && (
              <button
                type="button"
                onClick={onOpenBatchRename}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 rounded-lg transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Batch Rename & Regex Pattern Tool</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* Concurrency Throttling Control */}
      <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Worker Threads:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={8}
            value={concurrency}
            onChange={(e) => onConcurrencyChange(parseInt(e.target.value))}
            className="w-20 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="font-mono text-neutral-200 w-4 text-center">{concurrency}</span>
        </div>
      </div>

    </div>
  );
};
