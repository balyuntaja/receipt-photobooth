// Utility untuk mendeteksi area foto di template images
// Mendeteksi area kosong/transparan atau area dengan warna putih/terang di tengah template

export interface DetectedPhotoArea {
  x: number;      // pixels from left
  y: number;      // pixels from top
  width: number;  // pixels
  height: number; // pixels
}

export interface DetectionOptions {
  threshold?: number;        // Threshold untuk deteksi area kosong (0-255), default 240
  minArea?: number;          // Minimum area dalam pixels, default 10000
  margin?: number;           // Margin dari edge untuk deteksi, default 20
}

/**
 * Mendeteksi area foto di template image dengan mencari area kosong/transparan
 * atau area dengan warna putih/terang
 */
export async function detectPhotoArea(
  templateImageUrl: string,
  options: DetectionOptions = {}
): Promise<DetectedPhotoArea | null> {
  const {
    threshold = 240,  // Threshold untuk warna terang (hampir putih)
    minArea = 10000, // Minimum area 100x100 pixels
    margin = 20,      // Margin 20 pixels dari edge
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Scan untuk menemukan area dengan alpha tinggi dan warna terang
      // Kita akan mencari area dengan alpha > 200 dan rata-rata RGB > threshold
      const width = canvas.width;
      const height = canvas.height;

      // Array untuk tracking pixel yang termasuk area foto
      const photoPixels: Array<{ x: number; y: number }> = [];

      // Scan seluruh image (skip margin dari edge)
      for (let y = margin; y < height - margin; y++) {
        for (let x = margin; x < width - margin; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // Cek apakah pixel ini transparan atau hampir putih
          // Area foto biasanya: transparan (alpha rendah) atau putih/terang (RGB tinggi)
          const isTransparent = a < 50; // Alpha rendah = transparan
          const isLight = (r + g + b) / 3 > threshold && a > 200; // Warna terang dengan alpha tinggi

          if (isTransparent || isLight) {
            photoPixels.push({ x, y });
          }
        }
      }

      if (photoPixels.length < minArea) {
        // Tidak cukup pixel, coba metode alternatif: cari area terbesar yang hampir putih
        resolve(detectLargestLightArea(imageData, width, height, margin, threshold));
        return;
      }

      // Hitung bounding box dari semua pixel yang terdeteksi
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (const pixel of photoPixels) {
        minX = Math.min(minX, pixel.x);
        minY = Math.min(minY, pixel.y);
        maxX = Math.max(maxX, pixel.x);
        maxY = Math.max(maxY, pixel.y);
      }

      // Pastikan ada area yang valid
      if (maxX > minX && maxY > minY && (maxX - minX) * (maxY - minY) >= minArea) {
        resolve({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        });
      } else {
        // Fallback: coba metode alternatif
        resolve(detectLargestLightArea(imageData, width, height, margin, threshold));
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load template image"));
    };

    img.src = templateImageUrl;
  });
}

/**
 * Metode alternatif: deteksi area terbesar dengan warna terang
 */
function detectLargestLightArea(
  imageData: ImageData,
  width: number,
  height: number,
  margin: number,
  threshold: number
): DetectedPhotoArea | null {
  const data = imageData.data;

  // Scan dari tengah ke luar untuk menemukan area terang terbesar
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Cari area terang di sekitar center
  let minX = centerX;
  let maxX = centerX;
  let minY = centerY;
  let maxY = centerY;

  // Expand dari center sampai menemukan boundary
  const visited = new Set<string>();

  function isLightPixel(x: number, y: number): boolean {
    if (x < margin || x >= width - margin || y < margin || y >= height - margin) {
      return false;
    }

    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);

    const index = (y * width + x) * 4;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];

    const avg = (r + g + b) / 3;
    return (a < 50) || (avg > threshold && a > 200);
  }

  // Flood fill dari center untuk menemukan area terang
  const queue: Array<{ x: number; y: number }> = [{ x: centerX, y: centerY }];
  visited.add(`${centerX},${centerY}`);

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;

    if (isLightPixel(x, y)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add neighbors
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key) && isLightPixel(neighbor.x, neighbor.y)) {
          queue.push(neighbor);
        }
      }
    }
  }

  // Pastikan area cukup besar
  const area = (maxX - minX) * (maxY - minY);
  if (area < 10000) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert pixel coordinates ke cm berdasarkan DPI
 */
export function pixelsToCM(pixels: number, dpi: number = 300): number {
  const INCH_TO_CM = 2.54;
  const pixelsPerInch = dpi;
  const inches = pixels / pixelsPerInch;
  return inches * INCH_TO_CM;
}

/**
 * Convert cm ke pixels berdasarkan DPI
 */
export function cmToPixels(cm: number, dpi: number = 300): number {
  const INCH_TO_CM = 2.54;
  const inches = cm / INCH_TO_CM;
  return Math.round(inches * dpi);
}

