import { useRef } from "react";
import { cropVideoToLandscape } from "@/lib/utils";

/**
 * Custom hook for capturing photos from video
 */
export function usePhotoCapture() {
  const canvasRef = useRef(null);

  const capturePhoto = (video) => {
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

    return canvas.toDataURL("image/png");
  };

  return {
    canvasRef,
    capturePhoto,
  };
}

