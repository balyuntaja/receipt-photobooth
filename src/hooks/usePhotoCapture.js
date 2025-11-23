import { useRef } from "react";
import { cropVideoToLandscape } from "@/lib/utils";

/**
 * Custom hook for capturing photos from video
 */
export function usePhotoCapture() {
  const canvasRef = useRef(null);

  const capturePhoto = (video, exposure = 50) => {
    if (!video || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Crop video to aspect ratio (4:3)
    const crop = cropVideoToLandscape(video);

    // Set canvas size
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Draw cropped video to canvas
    ctx.drawImage(
      video,
      crop.x, crop.y, crop.width, crop.height, // Source crop
      0, 0, canvas.width, canvas.height // Destination size
    );

    // Apply exposure filter to captured image
    if (exposure !== 50) {
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert exposure to brightness/contrast values
      // 0 = 0.3 brightness (very dark), 50 = 1.0 brightness (normal), 100 = 2.0 brightness (very bright)
      const brightness = 0.3 + (exposure / 100) * 1.7;
      const contrast = 0.7 + (exposure / 100) * 0.6;

      // Apply brightness and contrast to each pixel
      for (let i = 0; i < data.length; i += 4) {
        // RGB channels
        for (let j = 0; j < 3; j++) {
          // Apply brightness
          let value = data[i + j] * brightness;
          
          // Apply contrast
          value = ((value / 255 - 0.5) * contrast + 0.5) * 255;
          
          // Clamp to valid range
          data[i + j] = Math.max(0, Math.min(255, value));
        }
        // Alpha channel (i + 3) remains unchanged
      }

      // Put modified image data back to canvas
      ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL("image/png");
  };

  return {
    canvasRef,
    capturePhoto,
  };
}

