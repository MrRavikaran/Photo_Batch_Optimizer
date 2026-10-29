export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif';

export type FitMode = 'contain' | 'cover' | 'fill' | 'inside';

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  imageDataUrl?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'social' | 'web' | 'custom';
  maxWidth: number;
  maxHeight: number;
  fit: FitMode;
  format: OutputFormat;
  quality: number; // 1 - 100
  autoQuality: boolean;
  targetSimilarity?: number; // 0.85 - 0.99 SSIM
  keepPngTransparency: boolean;
  backgroundColor: string; // e.g. '#ffffff' or 'transparent'
  stripMetadata: boolean;
  filenameTemplate: string;
}

export interface ImageFilterSettings {
  enabled: boolean;
  grayscale: number; // 0 - 100 (%)
  sepia: number; // 0 - 100 (%)
  autoContrast: boolean;
  brightness: number; // 50 - 150 (%) default 100
  contrast: number; // 50 - 200 (%) default 100
  saturation: number; // 0 - 200 (%) default 100
  sharpen: boolean;
}

export interface OptimizationSettings {
  presetId: string;
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio: boolean;
  fit: FitMode;
  format: OutputFormat;
  quality: number; // 1-100
  autoQuality: boolean;
  targetSimilarity: number; // 0.85 - 0.99
  keepPngTransparency: boolean;
  backgroundColor: string;
  stripMetadata: boolean;
  filenameTemplate: string;
  watermark: WatermarkSettings;
  filters: ImageFilterSettings;
}

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  originalType: string;
  
  // Output
  status: FileStatus;
  progress: number; // 0 - 100
  errorMessage?: string;
  optimizedBlob?: Blob;
  optimizedUrl?: string;
  optimizedSize?: number;
  optimizedWidth?: number;
  optimizedHeight?: number;
  optimizedName?: string;
  optimizedFormat?: OutputFormat;
  savingsBytes?: number;
  savingsPercent?: number;
  processingTimeMs?: number;
  ssimScore?: number;
}

export interface BatchStats {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  originalBytes: number;
  optimizedBytes: number;
  savedBytes: number;
  savedPercent: number;
}

export interface ResponsiveSrcsetVariant {
  width: number;
  height: number;
  label: string;
  blob?: Blob;
  url?: string;
  size?: number;
}
