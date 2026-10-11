/**
 * Generator Gambar Stiker Quote / "Ocehanmu" berbasis HTML5 Canvas.
 * Menghasilkan data URL PNG beresolusi tinggi dengan sudut rounded dan latar artistik.
 */

export interface QuoteStylePreset {
  id: string;
  name: string;
  bgGradient: [string, string];
  bgImage?: string;
  textColor: string;
  quoteColor: string;
  authorColor: string;
  border: string;
  fontFamily: string;
}

export const QUOTE_STYLE_PRESETS: QuoteStylePreset[] = [
  {
    id: 'crumpled-paper',
    name: '📄 Kertas Lecek',
    bgGradient: ['#ffffff', '#f4f4f5'],
    bgImage: '/textures/crumpled-paper.png',
    textColor: '#18181b',
    quoteColor: '#d97706',
    authorColor: '#52525b',
    border: 'rgba(0, 0, 0, 0.12)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'lined-paper',
    name: '📝 Kertas Garis',
    bgGradient: ['#ffffff', '#f8fafc'],
    bgImage: '/textures/lined-paper.png',
    textColor: '#0f172a',
    quoteColor: '#2563eb',
    authorColor: '#475569',
    border: 'rgba(0, 0, 0, 0.12)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'sunset',
    name: '🌅 Sunset Aura',
    bgGradient: ['#ffecd2', '#fcb69f'],
    textColor: '#4a151b',
    quoteColor: '#e05638',
    authorColor: '#873228',
    border: 'rgba(255, 255, 255, 0.7)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'lavender',
    name: '💜 Lavender Dream',
    bgGradient: ['#e0c3fc', '#8ec5fc'],
    textColor: '#1e1b4b',
    quoteColor: '#6366f1',
    authorColor: '#4338ca',
    border: 'rgba(255, 255, 255, 0.8)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'mint',
    name: '🍃 Fresh Mint',
    bgGradient: ['#d4fc79', '#96e6a1'],
    textColor: '#064e3b',
    quoteColor: '#059669',
    authorColor: '#047857',
    border: 'rgba(255, 255, 255, 0.7)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'kraft',
    name: '☕ Kertas Kraft / Vintage',
    bgGradient: ['#f5e6ca', '#e6cfab'],
    textColor: '#38220f',
    quoteColor: '#92400e',
    authorColor: '#78350f',
    border: 'rgba(120, 53, 15, 0.25)',
    fontFamily: 'Georgia, serif',
  },
  {
    id: 'dark-neon',
    name: '✨ Midnight Glow',
    bgGradient: ['#1e1b4b', '#0f172a'],
    textColor: '#f8fafc',
    quoteColor: '#fbbf24',
    authorColor: '#cbd5e1',
    border: 'rgba(251, 191, 36, 0.4)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'clean-white',
    name: '🤍 Minimalist Badge',
    bgGradient: ['#ffffff', '#f8fafc'],
    textColor: '#0f172a',
    quoteColor: '#f59e0b',
    authorColor: '#64748b',
    border: 'rgba(0, 0, 0, 0.12)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
];

export const INSPIRING_QUOTES = [
  { text: 'Fokus pada langkah kecil hari ini, hasil besar akan mengikuti.', author: 'Semangat Pagi' },
  { text: 'Jangan menunggu sempurna untuk memulai, mulailah agar menjadi terbiasa.', author: 'Catatan Diri' },
  { text: 'Satu jam yang produktif dimulai dari niat yang tenang dan fokus.', author: 'Ocehan Santai' },
  { text: 'Istirahat sejenak adalah bagian dari strategi, bukan kemalasan.', author: 'Kebugaran Mental' },
  { text: 'Kesuksesan adalah kumpulan disiplin kecil yang diulang setiap hari.', author: 'Robert Collier' },
  { text: 'Kerjakan hal sulit selagi mudah, kerjakan hal besar selagi kecil.', author: 'Lao Tzu' },
  { text: 'Senyum dulu, tarik napas dalam, lalu tuntaskan misi selanjutnya!', author: 'Ceria Todo' },
];

/**
 * Merender teks quote ke gambar PNG resolusi tajam via HTML Canvas.
 */
export async function renderQuoteToImage(
  text: string,
  author: string,
  styleId = 'crumpled-paper',
  customBgImageUrl?: string | null
): Promise<string> {
  const preset = QUOTE_STYLE_PRESETS.find((p) => p.id === styleId) || QUOTE_STYLE_PRESETS[0];

  // Ukuran kanvas
  const width = 480;
  const padding = 36;
  const maxContentWidth = width - padding * 2;

  // Ukuran font
  const fontSize = text.length > 100 ? 20 : text.length > 50 ? 23 : 26;
  const lineHeight = fontSize * 1.45;

  // Siapkan canvas sementara untuk hitung baris
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  if (!testCtx) throw new Error('Canvas 2D context tidak didukung');

  testCtx.font = `bold ${fontSize}px ${preset.fontFamily}`;

  // Word wrap
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = testCtx.measureText(testLine);
    if (metrics.width > maxContentWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Hitung tinggi keseluruhan kanvas
  const quoteMarkHeight = 28;
  const textBlockHeight = lines.length * lineHeight;
  const authorHeight = author.trim() ? 32 : 0;
  const height = Math.max(180, padding * 2 + quoteMarkHeight + textBlockHeight + authorHeight + 16);

  // Buat kanvas resolusi tinggi (Retina scale 2x)
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context gagal');

  ctx.scale(scale, scale);

  // Rounded rectangle path definition
  const radius = 28;
  const defineRoundedRect = () => {
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
  };

  // Shadow lembut di sekitar stiker
  ctx.save();
  defineRoundedRect();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Background rendering (Gambar atau Gradient)
  const bgImgSrc = customBgImageUrl || preset.bgImage;
  if (bgImgSrc) {
    try {
      const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Gagal memuat background image'));
        img.src = bgImgSrc;
      });

      ctx.save();
      defineRoundedRect();
      ctx.clip();
      // Draw image to cover whole rect
      ctx.drawImage(bgImg, 0, 0, width, height);
      ctx.restore();
    } catch {
      // Fallback to gradient if image fails
      ctx.save();
      defineRoundedRect();
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, preset.bgGradient[0]);
      gradient.addColorStop(1, preset.bgGradient[1]);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.save();
    defineRoundedRect();
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, preset.bgGradient[0]);
    gradient.addColorStop(1, preset.bgGradient[1]);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  // Border stiker
  ctx.save();
  defineRoundedRect();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = preset.border;
  ctx.stroke();
  ctx.restore();

  // Simbol kutip pembuka (“)
  ctx.fillStyle = preset.quoteColor;
  ctx.font = `bold 42px ${preset.fontFamily}`;
  ctx.fillText('“', padding, padding + 22);

  // Teks Quote
  ctx.fillStyle = preset.textColor;
  ctx.font = `600 ${fontSize}px ${preset.fontFamily}`;
  let startY = padding + quoteMarkHeight + 8;
  for (const line of lines) {
    ctx.fillText(line, padding, startY);
    startY += lineHeight;
  }

  // Nama Penulis / Sumber
  if (author.trim()) {
    ctx.fillStyle = preset.authorColor;
    ctx.font = `italic 500 14px ${preset.fontFamily}`;
    ctx.fillText(`— ${author.trim()}`, padding, startY + 12);
  }

  // Return PNG Data URL
  return canvas.toDataURL('image/png', 0.95);
}
