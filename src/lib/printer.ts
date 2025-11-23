/**
 * Thermal Printer Utilities using WebUSB API
 * For ESC/POS compatible thermal printers (58mm)
 */

// Type definitions for WebUSB API
interface USBDevice {
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
}

interface USBOutTransferResult {
  status: string;
  bytesWritten: number;
}

interface USBRequestDeviceOptions {
  filters: Array<{ vendorId?: number; productId?: number }>;
}

interface Navigator {
  usb?: {
    requestDevice(options: USBRequestDeviceOptions): Promise<USBDevice>;
  };
}

let printer: USBDevice | null = null;

/**
 * Connect to thermal printer via WebUSB
 * @param vendorId - USB vendor ID (default: 0x0418 for common thermal printers)
 * @returns Connected printer device
 */
export async function connectPrinter(vendorId: number = 0x0418): Promise<USBDevice> {
  try {
    const nav = navigator as Navigator;
    if (!nav.usb) {
      throw new Error("WebUSB API tidak didukung di browser ini. Gunakan Chrome atau Edge.");
    }

    const device = await nav.usb.requestDevice({
      filters: [{ vendorId }] // Ganti sesuai printer Anda
    });

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    
    printer = device;
    console.log("Printer connected:", device);
    return device;
  } catch (error) {
    console.error("Error connecting printer:", error);
    throw error;
  }
}

/**
 * Check if printer is connected
 */
export function isPrinterConnected(): boolean {
  return printer !== null;
}

/**
 * Disconnect printer
 */
export async function disconnectPrinter(): Promise<void> {
  if (printer) {
    try {
      await printer.close();
      printer = null;
      console.log("Printer disconnected");
    } catch (error) {
      console.error("Error disconnecting printer:", error);
    }
  }
}

/**
 * Floyd-Steinberg Dithering
 * @param data - ImageData RGBA array
 * @param width - Image width
 * @param height - Image height
 */
function floydSteinbergDithering(data: Uint8ClampedArray, width: number, height: number): void {
  const getIndex = (x: number, y: number) => (width * y + x) * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIndex(x, y);
      const oldPixel = data[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      const error = oldPixel - newPixel;

      // Set RGB channels to new pixel value
      data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

      // Helper function to add error to neighboring pixels
      const add = (px: number, py: number, factor: number) => {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const i = getIndex(px, py);
          const val = data[i] + error * factor;
          const clampedVal = Math.max(0, Math.min(255, val));
          data[i] = data[i + 1] = data[i + 2] = clampedVal;
        }
      };

      // Distribute error to neighboring pixels
      add(x + 1, y, 7 / 16);
      add(x - 1, y + 1, 3 / 16);
      add(x, y + 1, 5 / 16);
      add(x + 1, y + 1, 1 / 16);
    }
  }
}

/**
 * Convert image to ESC/POS format (1-bit bitmap with dithering)
 * @param imageDataUrl - Data URL of the image
 * @param width - Target width in pixels (default: 680)
 * @returns Promise that resolves to ESC/POS command bytes
 */
async function convertToESCPos(imageDataUrl: string, width: number = 680): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas to resize and convert image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Calculate height maintaining aspect ratio (like Jimp.AUTO)
        const aspectRatio = img.height / img.width;
        const height = Math.round(width * aspectRatio);

        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convert to grayscale (work on R channel, then copy to G and B)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Convert to grayscale using standard formula
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          // Set all RGB channels to grayscale value
          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        // Apply Floyd-Steinberg dithering
        floydSteinbergDithering(data, width, height);

        // Convert to 1-bit bitmap (8 pixels per byte)
        const bytesPerRow = Math.ceil(width / 8);
        const bitmapData = new Uint8Array(bytesPerRow * height);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const pixelValue = data[idx]; // Get grayscale value from R channel
            const bit = pixelValue < 128 ? 1 : 0; // Inverted for thermal printer (black = 1)
            const byteIdx = Math.floor(x / 8);
            const bitPos = 7 - (x % 8);
            bitmapData[y * bytesPerRow + byteIdx] |= (bit << bitPos);
          }
        }

        // Build ESC/POS command
        const commands: number[] = [];
        
        // Initialize printer
        commands.push(0x1B, 0x40); // ESC @ (Initialize)
        
        // Set center alignment
        commands.push(0x1B, 0x61, 0x01); // ESC a 1 (Center align)
        
        // Set image mode
        commands.push(0x1D, 0x76, 0x30, 0x00); // GS v 0 (Print raster image)
        
        // Image width (LSB, MSB)
        const widthLow = bytesPerRow & 0xFF;
        const widthHigh = (bytesPerRow >> 8) & 0xFF;
        commands.push(widthLow, widthHigh);
        
        // Image height (LSB, MSB)
        const heightLow = height & 0xFF;
        const heightHigh = (height >> 8) & 0xFF;
        commands.push(heightLow, heightHigh);
        
        // Append bitmap data
        commands.push(...Array.from(bitmapData));
        
        // Feed paper and cut (if supported)
        commands.push(0x1D, 0x56, 0x00); // GS V 0 (Cut paper)
        commands.push(0x0A); // Line feed
        
        // Reset alignment to left (optional, for next print)
        commands.push(0x1B, 0x61, 0x00); // ESC a 0 (Left align)

        resolve(new Uint8Array(commands));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageDataUrl;
  });
}

/**
 * Print photostrip to thermal printer
 * @param imageDataUrl - Data URL of the photostrip image
 * @param quantity - Number of copies to print
 * @returns Promise that resolves when print is complete
 */
export async function printPhotostrip(
  imageDataUrl: string,
  quantity: number = 1
): Promise<void> {
  if (!printer) {
    throw new Error("Printer belum terhubung. Silakan hubungkan printer terlebih dahulu.");
  }

  try {
    // Convert image to ESC/POS format
    const escposData = await convertToESCPos(imageDataUrl);

    // Print multiple copies
    for (let i = 0; i < quantity; i++) {
      // Send data to printer
      await printer.transferOut(1, escposData);
      
      // Wait a bit between copies
      if (i < quantity - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Printed ${quantity} copy/copies successfully`);
  } catch (error) {
    console.error("Print error:", error);
    throw error;
  }
}

/**
 * Print photostrip from File/Blob
 * @param photoFile - File or Blob object of the photostrip
 * @param quantity - Number of copies to print
 */
export async function printPhotostripFromFile(
  photoFile: File | Blob,
  quantity: number = 1
): Promise<void> {
  // Convert File/Blob to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        await printPhotostrip(dataUrl, quantity);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(photoFile);
  });
}

