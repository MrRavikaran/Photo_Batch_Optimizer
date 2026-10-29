import { Preset } from '../types';

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'shopify-listing',
    name: 'Shopify Product Listing',
    description: '1000×1000 square WebP, balanced for catalog feeds and rapid loading',
    category: 'ecommerce',
    maxWidth: 1000,
    maxHeight: 1000,
    fit: 'contain',
    format: 'webp',
    quality: 80,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-shopify-{width}w.{ext}',
  },
  {
    id: 'shopify-hero',
    name: 'Shopify High-Res Hero',
    description: '2048×2048 crisp zoom-enabled main product photo in WebP format',
    category: 'ecommerce',
    maxWidth: 2048,
    maxHeight: 2048,
    fit: 'inside',
    format: 'webp',
    quality: 84,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-hero-2048.{ext}',
  },
  {
    id: 'amazon-main',
    name: 'Amazon Main Image (Pure White)',
    description: '1600×1600 with mandatory pure white background fill (#FFFFFF) and 85% JPEG',
    category: 'ecommerce',
    maxWidth: 1600,
    maxHeight: 1600,
    fit: 'contain',
    format: 'jpeg',
    quality: 85,
    autoQuality: false,
    keepPngTransparency: false,
    backgroundColor: '#ffffff',
    stripMetadata: true,
    filenameTemplate: '{name}-amazon-1600.{ext}',
  },
  {
    id: 'etsy-listing',
    name: 'Etsy Standard Product',
    description: '2000×2000 high-detail WebP with accurate color preservation for handmade items',
    category: 'ecommerce',
    maxWidth: 2000,
    maxHeight: 2000,
    fit: 'inside',
    format: 'webp',
    quality: 85,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-etsy.{ext}',
  },
  {
    id: 'woocommerce-catalog',
    name: 'WooCommerce Catalog Grid',
    description: '800×800 square thumbnail optimized for fast WordPress mobile browsing',
    category: 'ecommerce',
    maxWidth: 800,
    maxHeight: 800,
    fit: 'contain',
    format: 'webp',
    quality: 78,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-woo-800.{ext}',
  },
  {
    id: 'web-thumbnail',
    name: 'Mobile Cart & Thumbnail',
    description: '150×150 ultra-compact preview badge',
    category: 'web',
    maxWidth: 150,
    maxHeight: 150,
    fit: 'cover',
    format: 'webp',
    quality: 75,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-thumb-150.{ext}',
  },
  {
    id: 'auto-quality-smart',
    name: 'Smart Auto-Quality (SSIM Guided)',
    description: 'Iterative compression finding the minimum byte size that maintains perceptual clarity',
    category: 'ecommerce',
    maxWidth: 1200,
    maxHeight: 1200,
    fit: 'inside',
    format: 'webp',
    quality: 80,
    autoQuality: true,
    targetSimilarity: 0.94,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-smart-opt.{ext}',
  },
  {
    id: 'custom',
    name: 'Custom Configuration',
    description: 'Full manual control over dimensions, format, background, and watermark',
    category: 'custom',
    maxWidth: 1200,
    maxHeight: 1200,
    fit: 'inside',
    format: 'webp',
    quality: 80,
    autoQuality: false,
    keepPngTransparency: true,
    backgroundColor: 'transparent',
    stripMetadata: true,
    filenameTemplate: '{name}-opt-{width}w.{ext}',
  },
];

const STORAGE_KEY = 'photo_optimizer_custom_presets_v1';

export function loadSavedPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return [...DEFAULT_PRESETS, ...parsed.filter((p: Preset) => !DEFAULT_PRESETS.some(d => d.id === p.id))];
    }
  } catch (err) {
    console.warn('Failed to load custom presets from localStorage', err);
  }
  return DEFAULT_PRESETS;
}

export function saveCustomPreset(preset: Preset): void {
  try {
    const current = loadSavedPresets().filter(p => p.category === 'custom' && p.id !== 'custom');
    const updated = [...current.filter(p => p.id !== preset.id), preset];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save preset to localStorage', err);
  }
}

export function deleteCustomPreset(presetId: string): void {
  try {
    const current = loadSavedPresets().filter(p => p.category === 'custom' && p.id !== 'custom');
    const updated = current.filter(p => p.id !== presetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete preset from localStorage', err);
  }
}
