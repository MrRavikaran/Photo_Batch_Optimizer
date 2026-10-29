import { FitMode, OutputFormat, WatermarkSettings, ImageFilterSettings } from '../types';
import { calculateSSIM } from '../utils/similarity';

export interface WorkerJobPayload {
  jobId: string;
  imageBitmap?: ImageBitmap;
  imageBlob?: Blob;
  maxWidth: number;
  maxHeight: number;
  fit: FitMode;
  format: OutputFormat;
  quality: number; // 1-100
  autoQuality: boolean;
  targetSimilarity: number;
  keepPngTransparency: boolean;
  backgroundColor: string;
  watermark: WatermarkSettings;
  filters?: ImageFilterSettings;
}

export interface WorkerJobResult {
  jobId: string;
  success: boolean;
  blob?: Blob;
  width?: number;
  height?: number;
  size?: number;
  format?: OutputFormat;
  ssimScore?: number;
  qualityUsed?: number;
  error?: string;
}

function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
  fit: FitMode
): {
  canvasWidth: number;
  canvasHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
} {
  if (fit === 'inside') {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
    const w = Math.round(srcWidth * ratio);
    const h = Math.round(srcHeight * ratio);
    return {
      canvasWidth: w,
      canvasHeight: h,
      drawX: 0,
      drawY: 0,
      drawWidth: w,
      drawHeight: h,
    };
  }

  if (fit === 'contain') {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    const drawWidth = Math.round(srcWidth * ratio);
    const drawHeight = Math.round(srcHeight * ratio);
    const drawX = Math.round((maxWidth - drawWidth) / 2);
    const drawY = Math.round((maxHeight - drawHeight) / 2);
    return {
      canvasWidth: maxWidth,
      canvasHeight: maxHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    };
  }

  if (fit === 'cover') {
    const ratio = Math.max(maxWidth / srcWidth, maxHeight / srcHeight);
    const drawWidth = Math.round(srcWidth * ratio);
    const drawHeight = Math.round(srcHeight * ratio);
    const drawX = Math.round((maxWidth - drawWidth) / 2);
    const drawY = Math.round((maxHeight - drawHeight) / 2);
    return {
      canvasWidth: maxWidth,
      canvasHeight: maxHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    };
  }

  // fill
  return {
    canvasWidth: maxWidth,
    canvasHeight: maxHeight,
    drawX: 0,
    drawY: 0,
    drawWidth: maxWidth,
    drawHeight: maxHeight,
  };
}

function getMimeType(format: OutputFormat): string {
  switch (format) {
    case 'webp': return 'image/webp';
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'avif': return 'image/avif';
    default: return 'image/webp';
  }
}

async function renderToCanvas(
  bitmap: ImageBitmap,
  dim: ReturnType<typeof calculateDimensions>,
  payload: WorkerJobPayload
): Promise<OffscreenCanvas> {
  const canvas = new OffscreenCanvas(dim.canvasWidth, dim.canvasHeight);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

  if (!ctx) throw new Error('Could not get OffscreenCanvas 2d context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background Fill
  const isJpeg = payload.format === 'jpeg';
  const hasBg = payload.backgroundColor && payload.backgroundColor !== 'transparent';

  if (isJpeg || hasBg) {
    ctx.fillStyle = payload.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, dim.canvasWidth, dim.canvasHeight);
  } else {
    ctx.clearRect(0, 0, dim.canvasWidth, dim.canvasHeight);
  }

  // Apply CSS-like Filters before drawing image
  if (payload.filters?.enabled) {
    const f = payload.filters;
    const filterParts: string[] = [];

    if (f.grayscale > 0) filterParts.push(`grayscale(${f.grayscale}%)`);
    if (f.sepia > 0) filterParts.push(`sepia(${f.sepia}%)`);
    if (f.brightness !== 100) filterParts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) filterParts.push(`contrast(${f.contrast}%)`);
    if (f.saturation !== 100) filterParts.push(`saturate(${f.saturation}%)`);

    if (filterParts.length > 0) {
      try {
        ctx.filter = filterParts.join(' ');
      } catch {
        // filter not supported in some older headless worker contexts
      }
    }
  }

  // Draw scaled image
  ctx.drawImage(
    bitmap,
    dim.drawX,
    dim.drawY,
    dim.drawWidth,
    dim.drawHeight
  );

  // Reset filter so watermark and downstream renders remain clean
  try {
    ctx.filter = 'none';
  } catch {}

  // Auto-Contrast Histogram Dynamic Range Stretch
  if (payload.filters?.enabled && payload.filters.autoContrast) {
    try {
      const imgData = ctx.getImageData(0, 0, dim.canvasWidth, dim.canvasHeight);
      const data = imgData.data;
      let minL = 255;
      let maxL = 0;
      const step = Math.max(1, Math.floor(data.length / (4 * 10000)));
      for (let i = 0; i < data.length; i += step * 4) {
        if (data[i + 3] < 10) continue; // skip transparent
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < minL) minL = lum;
        if (lum > maxL) maxL = lum;
      }
      if (maxL > minL && (minL > 10 || maxL < 245)) {
        const range = maxL - minL;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;
          data[i] = Math.max(0, Math.min(255, ((data[i] - minL) * 255) / range));
          data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - minL) * 255) / range));
          data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - minL) * 255) / range));
        }
        ctx.putImageData(imgData, 0, 0);
      }
    } catch {
      // ignore
    }
  }

  // Sharpen unsharp mask filter
  if (payload.filters?.enabled && payload.filters.sharpen) {
    try {
      const imgData = ctx.getImageData(0, 0, dim.canvasWidth, dim.canvasHeight);
      const src = imgData.data;
      const output = ctx.createImageData(dim.canvasWidth, dim.canvasHeight);
      const dst = output.data;
      const w = dim.canvasWidth;
      const h = dim.canvasHeight;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const val =
              src[idx + c] * 2.5 -
              (src[((y - 1) * w + x) * 4 + c] +
               src[((y + 1) * w + x) * 4 + c] +
               src[(y * w + (x - 1)) * 4 + c] +
               src[(y * w + (x + 1)) * 4 + c]) * 0.375;
            dst[idx + c] = Math.max(0, Math.min(255, val));
          }
          dst[idx + 3] = src[idx + 3];
        }
      }
      ctx.putImageData(output, 0, 0);
    } catch {
      // ignore
    }
  }

  // Apply Watermark if enabled
  if (payload.watermark?.enabled) {
    const wm = payload.watermark;
    ctx.save();
    ctx.globalAlpha = Math.max(0.1, Math.min(1, (wm.opacity ?? 50) / 100));

    if (wm.type === 'text' && wm.text) {
      const fontSize = Math.max(12, Math.round((wm.fontSize || 24) * (dim.canvasWidth / 1000)));
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.fillStyle = wm.color || '#ffffff';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(wm.text);
      const padding = Math.round(fontSize * 0.8);
      let wx = padding;
      let wy = padding + fontSize / 2;

      switch (wm.position) {
        case 'center':
          wx = (dim.canvasWidth - metrics.width) / 2;
          wy = dim.canvasHeight / 2;
          break;
        case 'top-left':
          wx = padding;
          wy = padding + fontSize / 2;
          break;
        case 'top-right':
          wx = dim.canvasWidth - metrics.width - padding;
          wy = padding + fontSize / 2;
          break;
        case 'bottom-left':
          wx = padding;
          wy = dim.canvasHeight - padding - fontSize / 2;
          break;
        case 'bottom-right':
        default:
          wx = dim.canvasWidth - metrics.width - padding;
          wy = dim.canvasHeight - padding - fontSize / 2;
          break;
      }

      // Subtle text drop shadow for legibility
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(wm.text, wx, wy);
    }
    ctx.restore();
  }

  return canvas;
}

export async function processImageInWorker(payload: WorkerJobPayload): Promise<WorkerJobResult> {
  let bitmap = payload.imageBitmap;
  let closeBitmapOnExit = false;

  try {
    if (!bitmap && payload.imageBlob) {
      bitmap = await createImageBitmap(payload.imageBlob);
      closeBitmapOnExit = true;
    }

    if (!bitmap) {
      throw new Error('No valid image data provided for processing');
    }

    const srcWidth = bitmap.width;
    const srcHeight = bitmap.height;

    const dim = calculateDimensions(
      srcWidth,
      srcHeight,
      payload.maxWidth || srcWidth,
      payload.maxHeight || srcHeight,
      payload.fit
    );

    const canvas = await renderToCanvas(bitmap, dim, payload);
    const mimeType = getMimeType(payload.format);

    let chosenQuality = payload.quality;
    let finalBlob: Blob;
    let ssimScore = 1.0;

    if (payload.autoQuality && payload.format !== 'png') {
      // Perceptual Auto-Quality Search
      const targetSSIM = payload.targetSimilarity || 0.94;
      
      // Create reference small ImageData for quick SSIM comparison
      const refCanvas = new OffscreenCanvas(64, 64);
      const refCtx = refCanvas.getContext('2d')!;
      refCtx.drawImage(canvas, 0, 0, 64, 64);
      const refImgData = refCtx.getImageData(0, 0, 64, 64);

      let low = 40;
      let high = 95;
      let bestQuality = 80;
      let bestBlob: Blob | null = null;
      let bestSSIM = 1.0;

      for (let iter = 0; iter < 4; iter++) {
        const mid = Math.round((low + high) / 2);
        const testQuality = mid / 100;
        const testBlob = await canvas.convertToBlob({ type: mimeType, quality: testQuality });

        // Decode test blob back to 64x64 to measure perceptual loss
        const testBitmap = await createImageBitmap(testBlob);
        const testCanvas = new OffscreenCanvas(64, 64);
        const testCtx = testCanvas.getContext('2d')!;
        testCtx.drawImage(testBitmap, 0, 0, 64, 64);
        const testImgData = testCtx.getImageData(0, 0, 64, 64);
        testBitmap.close();

        const ssim = calculateSSIM(refImgData, testImgData);

        if (ssim >= targetSSIM) {
          bestQuality = mid;
          bestBlob = testBlob;
          bestSSIM = ssim;
          high = mid - 1; // Try even lower quality to save bytes
        } else {
          low = mid + 1; // Needs higher quality
        }
      }

      chosenQuality = bestQuality;
      finalBlob = bestBlob || await canvas.convertToBlob({ type: mimeType, quality: chosenQuality / 100 });
      ssimScore = bestSSIM;
    } else {
      const q = payload.format === 'png' ? undefined : (chosenQuality / 100);
      finalBlob = await canvas.convertToBlob({ type: mimeType, quality: q });
    }

    return {
      jobId: payload.jobId,
      success: true,
      blob: finalBlob,
      width: dim.canvasWidth,
      height: dim.canvasHeight,
      size: finalBlob.size,
      format: payload.format,
      qualityUsed: chosenQuality,
      ssimScore: Number(ssimScore.toFixed(3)),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      jobId: payload.jobId,
      success: false,
      error: message,
    };
  } finally {
    if (closeBitmapOnExit && bitmap) {
      bitmap.close();
    }
  }
}

// Handle Web Worker environment
self.onmessage = async (e: MessageEvent<WorkerJobPayload>) => {
  const result = await processImageInWorker(e.data);
  self.postMessage(result);
};
