/**
 * GIF Generator Utility
 * Converts multiple photos into an animated GIF
 * 
 * Requires: npm install gif.js @types/gif.js
 */

let gifJsModule: any = null;

/**
 * Check if gif.js is available
 */
async function checkGifJsAvailable(): Promise<boolean> {
  try {
    if (!gifJsModule) {
      gifJsModule = await import('gif.js');
    }
    return !!gifJsModule?.default;
  } catch (error) {
    console.warn('gif.js not available. Please install: npm install gif.js @types/gif.js');
    return false;
  }
}

/**
 * Generate GIF from multiple photo data URLs
 * @param photoDataUrls - Array of photo data URLs (minimum 2, recommended 3)
 * @param options - GIF generation options
 * @returns Promise that resolves to GIF data URL
 */
export async function generateGifFromPhotos(
  photoDataUrls: string[],
  options: {
    width?: number;
    height?: number;
    delay?: number; // Delay between frames in milliseconds
    quality?: number; // Quality (1-30, lower is better quality but larger file)
    repeat?: number; // -1 for infinite loop, 0 for no repeat
  } = {}
): Promise<string> {
  const {
    width = 800,
    height = 600,
    delay = 500, // 500ms delay between frames
    quality = 10,
    repeat = -1, // Infinite loop
  } = options;

  // Check if gif.js is available
  const isAvailable = await checkGifJsAvailable();
  if (!isAvailable) {
    throw new Error('gif.js library is not installed. Please run: npm install gif.js @types/gif.js');
  }

  // Dynamic import of gif.js
  const GIF = gifJsModule.default;

  return new Promise((resolve, reject) => {
    try {
      // Create GIF instance
      // Disable workers to avoid worker file loading issues in Vite
      // Workers can be enabled later if needed with proper Vite configuration
      const gif = new GIF({
        workers: 0, // Disable workers to avoid loading issues
        quality: quality,
        width: width,
        height: height,
        repeat: repeat,
        workerScript: undefined, // Don't use worker script
      });

      // Load all images first
      const imagePromises = photoDataUrls.map((dataUrl) => {
        return new Promise<HTMLImageElement>((imgResolve, imgReject) => {
          const img = new Image();
          img.onload = () => imgResolve(img);
          img.onerror = () => imgReject(new Error('Failed to load image'));
          img.src = dataUrl;
        });
      });

      Promise.all(imagePromises)
        .then((images) => {
          // Create canvas for each frame
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          // Use willReadFrequently to optimize for multiple readback operations
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Add each image as a frame
          images.forEach((img) => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Calculate scaling to fit image in canvas while maintaining aspect ratio
            const imgAspect = img.width / img.height;
            const canvasAspect = width / height;
            
            let drawWidth = width;
            let drawHeight = height;
            let drawX = 0;
            let drawY = 0;

            if (imgAspect > canvasAspect) {
              // Image is wider - fit to width
              drawHeight = width / imgAspect;
              drawY = (height - drawHeight) / 2;
            } else {
              // Image is taller - fit to height
              drawWidth = height * imgAspect;
              drawX = (width - drawWidth) / 2;
            }

            // Draw image centered
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // Add frame to GIF
            gif.addFrame(canvas, { delay: delay });
          });

          // Render GIF
          gif.on('finished', (blob: Blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              reject(new Error('Failed to read GIF blob'));
            };
            reader.readAsDataURL(blob);
          });

          gif.on('progress', (p: number) => {
            console.log(`GIF generation progress: ${(p * 100).toFixed(1)}%`);
          });

          gif.render();
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to generate GIF'));
    }
  });
}

/**
 * Generate GIF with default settings optimized for photobooth
 * @param photoDataUrls - Array of 3 photo data URLs
 * @returns Promise that resolves to GIF data URL
 */
export async function generatePhotoboothGif(photoDataUrls: string[]): Promise<string> {
  if (photoDataUrls.length < 2) {
    throw new Error('At least 2 photos are required to create a GIF');
  }

  return generateGifFromPhotos(photoDataUrls, {
    width: 800,
    height: 600,
    delay: 500, // 0.5 seconds per frame
    quality: 10, // Good quality
    repeat: -1, // Infinite loop
  });
}

