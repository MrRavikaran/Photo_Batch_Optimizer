/**
 * Fast Structural Similarity (SSIM) estimation between two image pixel buffers.
 * Compares luminance, contrast, and structure on downscaled or normalized image data.
 * Returns a value between 0.0 (completely dissimilar) and 1.0 (identical).
 */
export function calculateSSIM(
  imgDataA: ImageData,
  imgDataB: ImageData
): number {
  if (imgDataA.width !== imgDataB.width || imgDataA.height !== imgDataB.height) {
    return 0;
  }

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;
  const numPixels = imgDataA.width * imgDataA.height;

  // Convert to luminance Y = 0.299*R + 0.587*G + 0.114*B
  const lumA = new Float32Array(numPixels);
  const lumB = new Float32Array(numPixels);

  let meanA = 0;
  let meanB = 0;

  for (let i = 0, p = 0; i < numPixels; i++, p += 4) {
    const yA = 0.299 * dataA[p] + 0.587 * dataA[p + 1] + 0.114 * dataA[p + 2];
    const yB = 0.299 * dataB[p] + 0.587 * dataB[p + 1] + 0.114 * dataB[p + 2];
    lumA[i] = yA;
    lumB[i] = yB;
    meanA += yA;
    meanB += yB;
  }

  meanA /= numPixels;
  meanB /= numPixels;

  let varA = 0;
  let varB = 0;
  let covar = 0;

  for (let i = 0; i < numPixels; i++) {
    const diffA = lumA[i] - meanA;
    const diffB = lumB[i] - meanB;
    varA += diffA * diffA;
    varB += diffB * diffB;
    covar += diffA * diffB;
  }

  varA /= (numPixels - 1 || 1);
  varB /= (numPixels - 1 || 1);
  covar /= (numPixels - 1 || 1);

  // Constants to stabilize division with weak denominator
  const k1 = 0.01;
  const k2 = 0.03;
  const L = 255;
  const c1 = (k1 * L) * (k1 * L);
  const c2 = (k2 * L) * (k2 * L);

  const numerator = (2 * meanA * meanB + c1) * (2 * covar + c2);
  const denominator = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);

  const ssim = denominator === 0 ? 1 : numerator / denominator;
  return Math.max(0, Math.min(1, ssim));
}
