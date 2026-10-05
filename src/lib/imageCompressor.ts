/**
 * Helper to compress and crop an uploaded image to a lightweight square data URL (WebP/JPEG)
 * Suitable for storage in browser localStorage without exceeding quota.
 */
export async function compressImageToDataUrl(
  file: File,
  targetSize: number = 160
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic file type validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (JPG, PNG, WEBP, dll)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Gagal memproses gambar di canvas'));
            return;
          }

          // Center crop to a square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Convert to WebP or fallback to JPEG with 0.85 quality (~5-15 KB)
          let dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper to compress wallpaper images for board backgrounds while preserving aspect ratio.
 * Keeps resolution sharp for full-screen display while keeping file size small (~80-180KB)
 * for safe localStorage persistence.
 */
export async function compressWallpaperImageToDataUrl(
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1200,
  quality: number = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (JPG, PNG, WEBP, dll)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than maximum bounds while keeping aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Gagal memproses gambar di canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP or fallback to JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

