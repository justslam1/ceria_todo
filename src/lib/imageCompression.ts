/**
 * Utility untuk kompresi gambar berbasis client-side HTML5 Canvas.
 * Mengubah gambar besar/screenshot clipboard menjadi WebP Base64 berukuran ringan (~50KB - 200KB).
 */

export async function compressImage(
  fileOrBlob: Blob,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Gagal membaca data gambar'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proporsional jika melebihi batas maksimum
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
          // Fallback ke dataUrl asli jika context canvas gagal
          resolve(dataUrl);
          return;
        }

        // Kualitas rendering yang halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP terlebih dahulu (rasio kompresi terbaik)
        let outputDataUrl = canvas.toDataURL('image/webp', quality);

        // Jika browser tidak mendukung WebP (fallback ke JPEG)
        if (!outputDataUrl.startsWith('data:image/webp')) {
          outputDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(outputDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Format file gambar tidak valid atau rusak'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Gagal memproses file'));
    };

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Memeriksa ClipboardEvent dan mengekstrak file gambar jika tersedia
 */
export function getImageFileFromClipboard(e: ClipboardEvent | React.ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  // Fallback: periksa clipboardData.files
  const files = e.clipboardData?.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        return files[i];
      }
    }
  }

  return null;
}
