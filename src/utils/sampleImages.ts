/**
 * Generates rich, realistic synthetic product photography samples directly in-memory.
 * Provides immediate testing without needing external network calls or file uploads.
 */

export interface SampleProduct {
  name: string;
  filename: string;
  width: number;
  height: number;
  category: string;
  type: 'image/png' | 'image/jpeg';
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    name: 'Precision Chronograph Watch',
    filename: 'luxury-chronograph-watch.png',
    width: 2000,
    height: 2000,
    category: 'Watches & Jewelry',
    type: 'image/png',
  },
  {
    name: 'Studio Wireless ANC Headphones',
    filename: 'pro-wireless-headphones.jpg',
    width: 2400,
    height: 1800,
    category: 'Electronics',
    type: 'image/jpeg',
  },
  {
    name: 'Heritage Stitched Leather Sneakers',
    filename: 'heritage-leather-sneaker.jpg',
    width: 2200,
    height: 1600,
    category: 'Footwear',
    type: 'image/jpeg',
  },
  {
    name: 'Artisan Glass Botanical Perfume',
    filename: 'amber-glass-perfume.png',
    width: 1800,
    height: 2200,
    category: 'Beauty & Fragrance',
    type: 'image/png',
  },
];

export async function createSampleProductFile(sample: SampleProduct): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = sample.width;
  canvas.height = sample.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create sample canvas');

  // Background
  if (sample.type === 'image/jpeg') {
    const bgGrad = ctx.createRadialGradient(
      sample.width / 2, sample.height / 2, 50,
      sample.width / 2, sample.height / 2, sample.width * 0.7
    );
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.6, '#e2e8f0');
    bgGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, sample.width, sample.height);
  } else {
    // Transparent or subtle transparent backdrop for PNG
    ctx.clearRect(0, 0, sample.width, sample.height);
  }

  // Draw product illustration with fine high-frequency noise & textures (which makes compression realistic!)
  const cx = sample.width / 2;
  const cy = sample.height / 2;

  if (sample.name.includes('Watch')) {
    // Draw Watch Case & Bezel
    const radius = Math.min(sample.width, sample.height) * 0.32;
    
    // Drop shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 30;

    // Outer steel case
    const caseGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    caseGrad.addColorStop(0, '#e2e8f0');
    caseGrad.addColorStop(0.3, '#94a3b8');
    caseGrad.addColorStop(0.5, '#f8fafc');
    caseGrad.addColorStop(0.8, '#64748b');
    caseGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = caseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Dark dial
    ctx.shadowColor = 'transparent';
    const dialGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    dialGrad.addColorStop(0, '#0f172a');
    dialGrad.addColorStop(0.85, '#020617');
    dialGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = dialGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner gold accents & hour markers
    ctx.lineWidth = Math.max(3, radius * 0.02);
    ctx.strokeStyle = '#f59e0b';
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6) * (Math.PI / 180);
      const isHour = i % 5 === 0;
      const innerR = isHour ? radius * 0.8 : radius * 0.9;
      const outerR = radius * 0.95;
      ctx.lineWidth = isHour ? Math.max(4, radius * 0.025) : Math.max(1, radius * 0.008);
      ctx.strokeStyle = isHour ? '#fbbf24' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // Sub-dials
    for (const offsetAngle of [-0.6, 0.6, Math.PI / 2]) {
      const subX = cx + Math.cos(offsetAngle) * (radius * 0.45);
      const subY = cy + Math.sin(offsetAngle) * (radius * 0.45);
      const subR = radius * 0.22;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(subX, subY, subR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Watch hands
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = Math.max(5, radius * 0.035);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(-Math.PI / 4) * (radius * 0.55), cy + Math.sin(-Math.PI / 4) * (radius * 0.55));
    ctx.stroke();

    ctx.lineWidth = Math.max(3, radius * 0.02);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(Math.PI / 6) * (radius * 0.75), cy + Math.sin(Math.PI / 6) * (radius * 0.75));
    ctx.stroke();

    // Red second hand
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(0.8) * 30, cy - Math.sin(0.8) * 30);
    ctx.lineTo(cx + Math.cos(0.8) * (radius * 0.88), cy + Math.sin(0.8) * (radius * 0.88));
    ctx.stroke();

    // Brand text on dial
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `600 ${Math.round(radius * 0.09)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('AETHEL & CO.', cx, cy - radius * 0.48);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `400 ${Math.round(radius * 0.045)}px sans-serif`;
    ctx.fillText('CHRONOMETER · AUTOMATIC', cx, cy - radius * 0.36);
  } else if (sample.name.includes('Headphones')) {
    // Headphones
    const r = Math.min(sample.width, sample.height) * 0.35;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 25;

    // Headband arc
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.2, r * 0.85, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    // Earcups
    for (const side of [-1, 1]) {
      const cupX = cx + side * (r * 0.85);
      const cupY = cy + r * 0.2;
      
      // Outer shell
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(cupX, cupY, r * 0.26, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Metallic trim
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Memory foam cushion
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(cupX - side * 15, cupY, r * 0.18, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Acoustic mesh texture detail
    ctx.fillStyle = '#3f3f46';
    ctx.font = `500 ${Math.round(r * 0.08)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STUDIO PRO ANC · HIFI 96kHz', cx, cy + r * 0.75);
  } else if (sample.name.includes('Sneakers')) {
    // Sneaker Profile
    const w = sample.width * 0.65;
    const h = sample.height * 0.38;
    const sx = cx - w * 0.48;
    const sy = cy - h * 0.2;

    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 25;

    // Midsole & Sole
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(sx, sy + h * 0.7, w, h * 0.3, [10, 30, 20, 20]);
    ctx.fill();

    // Gum tread
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(sx + 5, sy + h * 0.92, w - 10, h * 0.08, [0, 0, 15, 15]);
    ctx.fill();

    // Upper leather body
    ctx.shadowColor = 'transparent';
    const upperGrad = ctx.createLinearGradient(sx, sy, sx + w, sy + h);
    upperGrad.addColorStop(0, '#78350f');
    upperGrad.addColorStop(0.5, '#92400e');
    upperGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = upperGrad;

    ctx.beginPath();
    ctx.moveTo(sx + w * 0.05, sy + h * 0.7);
    ctx.quadraticCurveTo(sx + w * 0.02, sy + h * 0.2, sx + w * 0.25, sy + h * 0.1);
    ctx.lineTo(sx + w * 0.6, sy + h * 0.25);
    ctx.quadraticCurveTo(sx + w * 0.85, sy + h * 0.45, sx + w * 0.98, sy + h * 0.7);
    ctx.closePath();
    ctx.fill();

    // Stitching detail
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Eyestay and laces
    ctx.fillStyle = '#fef3c7';
    for (let l = 0; l < 5; l++) {
      ctx.fillRect(sx + w * 0.32 + l * 26, sy + h * 0.28 + l * 18, 45, 6);
    }
  } else {
    // Perfume Glass Bottle
    const bw = sample.width * 0.3;
    const bh = sample.height * 0.45;
    const bx = cx - bw / 2;
    const by = cy - bh / 2 + 50;

    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 20;

    // Liquid in glass
    const liquidGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    liquidGrad.addColorStop(0, 'rgba(217, 119, 6, 0.85)');
    liquidGrad.addColorStop(1, 'rgba(180, 83, 9, 0.95)');
    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    ctx.roundRect(bx + 12, by + bh * 0.2, bw - 24, bh * 0.75, [8, 8, 20, 20]);
    ctx.fill();

    // Thick glass wall
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, [16, 16, 24, 24]);
    ctx.stroke();

    // Gold Atomizer & Cap
    ctx.shadowColor = 'transparent';
    const goldGrad = ctx.createLinearGradient(cx - bw * 0.2, by - 80, cx + bw * 0.2, by);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#ca8a04');
    goldGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(cx - bw * 0.2, by - 90, bw * 0.4, 90);

    // Label on bottle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + bw * 0.15, by + bh * 0.35, bw * 0.7, bh * 0.3);
    ctx.fillStyle = '#18181b';
    ctx.font = `bold ${Math.round(bw * 0.08)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('AMBRE NOIR', cx, by + bh * 0.48);
    ctx.font = `500 ${Math.round(bw * 0.045)}px sans-serif`;
    ctx.fillStyle = '#71717a';
    ctx.fillText('EAU DE PARFUM · 100ML', cx, by + bh * 0.56);
  }

  // Realistic photographic micro-grain to test compression high frequencies
  const imgData = ctx.getImageData(0, 0, sample.width, sample.height);
  const data = imgData.data;
  // Apply light grain on 10% of pixels to emulate real camera sensor noise
  for (let i = 0; i < data.length; i += 16) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const quality = sample.type === 'image/jpeg' ? 0.95 : undefined;
  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), sample.type, quality);
  });

  return new File([blob], sample.filename, { type: sample.type });
}
