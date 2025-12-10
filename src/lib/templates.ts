// Template data untuk photostrip
import template1 from "@/assets/template-1.png";
import template2 from "@/assets/template-2.png";
import template3 from "@/assets/template-3.png";
import { detectPhotoArea, pixelsToCM } from "./template-detector";

export interface Template {
  id: string;
  name: string;
  previewImage: string;
  templateImage: string;
  dimensions: {
    width: number;
    height: number;
  };
  photoArea?: {
    width: number; // cm
    height: number; // cm
    x: number; // cm from left
    y: number; // cm from top
  };
  // Preview area khusus untuk preview di PhotoEditor (ukuran berbeda dari photoArea untuk print)
  previewArea?: {
    width: number; // cm
    height: number; // cm
    x: number; // cm from left
    y: number; // cm from top
  };
}

// Ukuran print: 8cm x 11cm untuk printer thermal
// Konversi ke pixels pada 300 DPI (kualitas tinggi untuk thermal printer)
// 300 DPI = 300 pixels/inch = 118.11 pixels/cm
// 8cm = 945 pixels, 11cm = 1299 pixels
export const PRINT_DIMENSIONS_CM = {
  WIDTH: 8,
  HEIGHT: 11,
} as const;

export const PRINT_CONFIG = {
  DPI: 300,
  INCH_TO_CM: 2.54,
} as const;

const PIXELS_PER_CM = PRINT_CONFIG.DPI / PRINT_CONFIG.INCH_TO_CM; // ~118.11 pixels/cm
const PRINT_WIDTH_PX = Math.round(PRINT_DIMENSIONS_CM.WIDTH * PIXELS_PER_CM); // 945 pixels
const PRINT_HEIGHT_PX = Math.round(PRINT_DIMENSIONS_CM.HEIGHT * PIXELS_PER_CM); // 1299 pixels

// Fungsi untuk detect dan setup photo area untuk setiap template
// Akan mendeteksi area kosong/transparan di template images secara otomatis
async function detectAndSetPhotoArea(templateId: string, templateImageUrl: string): Promise<{
  width: number;
  height: number;
  x: number;
  y: number;
}> {
  try {
    const detected = await detectPhotoArea(templateImageUrl, {
      threshold: 240,  // Threshold untuk warna terang
      minArea: 5000,    // Minimum area
      margin: 10,       // Margin dari edge
    });

    if (detected) {
      // Convert dari pixels ke cm
      const widthCM = pixelsToCM(detected.width, PRINT_CONFIG.DPI);
      const heightCM = pixelsToCM(detected.height, PRINT_CONFIG.DPI);
      const xCM = pixelsToCM(detected.x, PRINT_CONFIG.DPI);
      const yCM = pixelsToCM(detected.y, PRINT_CONFIG.DPI);

      console.log(`[Template ${templateId}] Detected photo area:`, {
        pixels: detected,
        cm: { x: xCM, y: yCM, width: widthCM, height: heightCM },
      });

      return {
        width: widthCM,
        height: heightCM,
        x: xCM,
        y: yCM,
      };
    }
  } catch (error) {
    console.warn(`[Template ${templateId}] Failed to detect photo area:`, error);
  }

  // Fallback: default center position
  const PHOTO_AREA_WIDTH_CM = 6.33;
  const PHOTO_AREA_HEIGHT_CM = 5.66;
  return {
    width: PHOTO_AREA_WIDTH_CM,
    height: PHOTO_AREA_HEIGHT_CM,
    x: (PRINT_DIMENSIONS_CM.WIDTH - PHOTO_AREA_WIDTH_CM) / 2,
    y: (PRINT_DIMENSIONS_CM.HEIGHT - PHOTO_AREA_HEIGHT_CM) / 2,
  };
}

// Area foto di template (dalam cm) - akan di-override oleh detection
const PHOTO_AREA_WIDTH_CM = 6.33;
const PHOTO_AREA_HEIGHT_CM = 5.66;

// Template definitions dengan photoArea yang akan di-detect secara dinamis
// previewArea digunakan khusus untuk preview di PhotoEditor dengan ukuran yang berbeda
export const templates: Template[] = [
  {
    id: "template-1",
    name: "Template 1",
    previewImage: template1,
    templateImage: template1,
    dimensions: {
      width: PRINT_WIDTH_PX, // 945 pixels (8cm at 300 DPI)
      height: PRINT_HEIGHT_PX, // 1299 pixels (11cm at 300 DPI)
    },
    photoArea: {
      width: PHOTO_AREA_WIDTH_CM, // 6.33cm
      height: PHOTO_AREA_HEIGHT_CM, // 5.66cm
      x: (PRINT_DIMENSIONS_CM.WIDTH - PHOTO_AREA_WIDTH_CM) / 2, // Center horizontal
      y: (PRINT_DIMENSIONS_CM.HEIGHT - PHOTO_AREA_HEIGHT_CM) / 2, // Center vertical
    },
    previewArea: {
      width: 7.33, // cm
      height: 5.49, // cm
      x: 0.34, // cm
      y: 0.65, // cm
    },
  },
  {
    id: "template-2",
    name: "Template 2",
    previewImage: template2,
    templateImage: template2,
    dimensions: {
      width: PRINT_WIDTH_PX, // 945 pixels (8cm at 300 DPI)
      height: PRINT_HEIGHT_PX, // 1299 pixels (11cm at 300 DPI)
    },
    photoArea: {
      width: PHOTO_AREA_WIDTH_CM, // 6.33cm
      height: PHOTO_AREA_HEIGHT_CM, // 5.66cm
      x: (PRINT_DIMENSIONS_CM.WIDTH - PHOTO_AREA_WIDTH_CM) / 2, // Center horizontal
      y: (PRINT_DIMENSIONS_CM.HEIGHT - PHOTO_AREA_HEIGHT_CM) / 2, // Center vertical
    },
    previewArea: {
      width: 6.4, // cm
      height: 4.8, // cm
      x: 1.09, // cm
      y: 3.88, // cm
    },
  },
  {
    id: "template-3",
    name: "Template 3",
    previewImage: template3,
    templateImage: template3,
    dimensions: {
      width: PRINT_WIDTH_PX, // 945 pixels (8cm at 300 DPI)
      height: PRINT_HEIGHT_PX, // 1299 pixels (11cm at 300 DPI)
    },
    photoArea: {
      width: PHOTO_AREA_WIDTH_CM, // 6.33cm
      height: PHOTO_AREA_HEIGHT_CM, // 5.66cm
      x: (PRINT_DIMENSIONS_CM.WIDTH - PHOTO_AREA_WIDTH_CM) / 2, // Center horizontal
      y: (PRINT_DIMENSIONS_CM.HEIGHT - PHOTO_AREA_HEIGHT_CM) / 2, // Center vertical
    },
    previewArea: {
      width: 7.03, // cm
      height: 5.27, // cm
      x: 0.48, // cm
      y: 1.01, // cm
    },
  },
];

// Export print dimensions untuk digunakan di print function
export const PRINT_DIMENSIONS = {
  width: PRINT_WIDTH_PX,
  height: PRINT_HEIGHT_PX,
  widthCM: PRINT_DIMENSIONS_CM.WIDTH,
  heightCM: PRINT_DIMENSIONS_CM.HEIGHT,
  dpi: PRINT_CONFIG.DPI,
};

// Initialize: Detect photo areas for all templates
// Ini akan berjalan saat module di-load dan akan update photoArea untuk setiap template
export async function initializeTemplatePhotoAreas(): Promise<void> {
  for (const template of templates) {
    const detectedArea = await detectAndSetPhotoArea(template.id, template.templateImage || template.previewImage);
    if (template.photoArea && detectedArea) {
      template.photoArea.width = detectedArea.width;
      template.photoArea.height = detectedArea.height;
      template.photoArea.x = detectedArea.x;
      template.photoArea.y = detectedArea.y;
    }
  }
  console.log("Template photo areas initialized:", templates.map(t => ({
    id: t.id,
    photoArea: t.photoArea,
  })));
}
