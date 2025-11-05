// Utility functions for the application

/**
 * Merge class names (similar to clsx)
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") return cls;
      if (Array.isArray(cls)) return cls.filter(Boolean).join(" ");
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Convert data URL to Blob
 */
export function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Calculate photo position in pixels from CM
 */
export function calculatePhotoPosition(photoArea, dpi, inchToCm) {
  if (!photoArea) return undefined;
  
  const pixelsPerCM = dpi / inchToCm;
  return {
    x: Math.round(photoArea.x * pixelsPerCM),
    y: Math.round(photoArea.y * pixelsPerCM),
    width: Math.round(photoArea.width * pixelsPerCM),
    height: Math.round(photoArea.height * pixelsPerCM),
  };
}

/**
 * Crop video to match aspect ratio (4:3)
 */
export function cropVideoToLandscape(video) {
  const landscapeAspectRatio = 4 / 3;
  const videoAspectRatio = video.videoWidth / video.videoHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;

  if (videoAspectRatio > landscapeAspectRatio) {
    // Video is wider - crop width (center crop)
    sourceWidth = video.videoHeight * landscapeAspectRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else {
    // Video is taller - crop height (center crop)
    sourceHeight = video.videoWidth / landscapeAspectRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }

  return {
    x: sourceX,
    y: sourceY,
    width: sourceWidth,
    height: sourceHeight,
  };
}

/**
 * Common background styles
 */
export const BACKGROUND_STYLES = {
  fullscreen: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
};
