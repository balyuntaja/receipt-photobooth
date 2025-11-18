// Image processing utilities for merging photos with templates

/**
 * Apply grain (noise) effect to an image
 * @param imageDataUrl - Data URL of the image
 * @param intensity - Grain intensity (0-1), default 0.05 (5%)
 * @returns Data URL of the image with grain effect
 */
export async function applyGrainFilter(imageDataUrl: string, intensity: number = 0.05): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply grain effect by adding random noise
      // Intensity of 0.05 means 5% of the pixel value range (0-255) = ~12.75
      const noiseRange = 255 * intensity;
      
      for (let i = 0; i < data.length; i += 4) {
        // Generate random noise between -noiseRange/2 and +noiseRange/2
        const noise = (Math.random() - 0.5) * noiseRange;
        
        // Apply noise to each RGB channel
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const result = canvas.toDataURL("image/png", 1.0);
      resolve(result);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image for grain conversion"));
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Apply grayscale (black and white) filter to an image
 * @param imageDataUrl - Data URL of the image
 * @returns Data URL of the grayscale image
 */
export async function applyGrayscaleFilter(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply grayscale filter
      // Using luminance formula: 0.299*R + 0.587*G + 0.114*B
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate grayscale value
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Set RGB to grayscale value
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const result = canvas.toDataURL("image/png", 1.0);
      resolve(result);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image for grayscale conversion"));
    };
    
    img.src = imageDataUrl;
  });
}

export interface MergeOptions {
  templateImageUrl: string;
  photoImageUrl: string;
  photoPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  templateDimensions?: {
    width: number;
    height: number;
  };
  photoTransform?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    mirror?: boolean;
  };
}

export async function mergePhotoWithTemplate(
  options: MergeOptions
): Promise<string> {
  const { templateImageUrl, photoImageUrl, photoPosition, templateDimensions, photoTransform } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Load template image
    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";

    templateImg.onload = () => {
      // Set canvas size to template dimensions (use actual image size)
      canvas.width = templateImg.width;
      canvas.height = templateImg.height;

      // Calculate scale factor if template image size differs from configured dimensions
      // This ensures photoPosition (calculated in config pixels) matches actual template image size
      let scaleX = 1;
      let scaleY = 1;
      if (templateDimensions && photoPosition) {
        // Scale based on actual vs configured template dimensions
        scaleX = templateImg.width / templateDimensions.width;
        scaleY = templateImg.height / templateDimensions.height;
      }

      // Load and draw photo
      const photoImg = new Image();
      photoImg.crossOrigin = "anonymous";

      photoImg.onload = () => {
        // Debug: Log incoming parameters
        console.log("[mergePhotoWithTemplate] Parameters:", {
          photoPosition,
          templateDimensions,
          actualTemplateSize: { width: templateImg.width, height: templateImg.height },
          photoSize: { width: photoImg.width, height: photoImg.height },
          scaleFactors: { scaleX, scaleY },
        });

        // If photoPosition is provided (with exact dimensions), use it
        if (photoPosition) {
          // Scale photoPosition to match actual template image dimensions
          const scaledPosition = {
            x: Math.round(photoPosition.x * scaleX),
            y: Math.round(photoPosition.y * scaleY),
            width: Math.round(photoPosition.width * scaleX),
            height: Math.round(photoPosition.height * scaleY),
          };
          
          console.log("[mergePhotoWithTemplate] Scaled position:", scaledPosition);
          
          // Ensure scaled position is within canvas bounds
          if (scaledPosition.x < 0) scaledPosition.x = 0;
          if (scaledPosition.y < 0) scaledPosition.y = 0;
          if (scaledPosition.x + scaledPosition.width > canvas.width) {
            scaledPosition.width = canvas.width - scaledPosition.x;
          }
          if (scaledPosition.y + scaledPosition.height > canvas.height) {
            scaledPosition.height = canvas.height - scaledPosition.y;
          }
          
          // No need to warn or clamp further - the bounds check above is sufficient
          // Template photo areas can be large (up to ~98% of canvas) which is normal
          
          // Calculate photo size to fill the area exactly (cover mode - no padding)
          // Use "cover" mode - photo will fill area completely, may crop if needed
          const photoAspectRatio = photoImg.width / photoImg.height;
          const areaAspectRatio = scaledPosition.width / scaledPosition.height;
          
          // Start with area dimensions
          let finalPhotoWidth = scaledPosition.width;
          let finalPhotoHeight = scaledPosition.height;
          
          // Adjust to maintain photo aspect ratio (cover mode - fill area completely)
          if (photoAspectRatio > areaAspectRatio) {
            // Photo is wider - fit by height, crop width
            finalPhotoHeight = scaledPosition.height;
            finalPhotoWidth = scaledPosition.height * photoAspectRatio;
          } else {
            // Photo is taller - fit by width, crop height
            finalPhotoWidth = scaledPosition.width;
            finalPhotoHeight = scaledPosition.width / photoAspectRatio;
          }
          
          // Apply user transform if provided (from PhotoEditor)
          const transform = photoTransform || {};
          const userScale = transform.scale ?? 1;
          const userOffsetX = transform.offsetX ?? 0;
          const userOffsetY = transform.offsetY ?? 0;
          
          // Calculate base photo size (with user scale applied)
          const scaledPhotoWidth = finalPhotoWidth * userScale;
          const scaledPhotoHeight = finalPhotoHeight * userScale;
          
          // Calculate base position (centered in area)
          const baseX = scaledPosition.x + (scaledPosition.width - finalPhotoWidth) / 2;
          const baseY = scaledPosition.y + (scaledPosition.height - finalPhotoHeight) / 2;
          
          // Apply user offset and scale adjustment
          // The offset is in viewport pixels, but we need to apply it relative to the base position
          // Scale adjustment: when photo is scaled up, center needs to account for the size difference
          const scaleAdjustmentX = (scaledPhotoWidth - finalPhotoWidth) / 2;
          const scaleAdjustmentY = (scaledPhotoHeight - finalPhotoHeight) / 2;
          
          // Convert viewport offset to canvas offset (approximate - assumes similar aspect ratios)
          // For better accuracy, we could track container size, but this works for most cases
          const offsetScaleFactor = 1; // Can be adjusted if viewport-to-canvas ratio is known
          const canvasOffsetX = userOffsetX * offsetScaleFactor;
          const canvasOffsetY = userOffsetY * offsetScaleFactor;
          
          const photoX = baseX + canvasOffsetX - scaleAdjustmentX;
          const photoY = baseY + canvasOffsetY - scaleAdjustmentY;
          
          // STEP 1: Draw photo FIRST (as background layer)
          // Use clipping to ensure photo only fills the designated photoArea
          ctx.save();
          
          // Create clipping rectangle - photo can ONLY be drawn within this area
          ctx.beginPath();
          ctx.rect(
            Math.round(scaledPosition.x),
            Math.round(scaledPosition.y),
            Math.round(scaledPosition.width),
            Math.round(scaledPosition.height)
          );
          ctx.clip(); // Enable clipping - photo CANNOT be drawn outside this rectangle
          
          // Debug: Log the position to verify it's correct
          console.log("Drawing photo at position (background layer):", {
            scaledArea: scaledPosition,
            photoSize: { width: scaledPhotoWidth, height: scaledPhotoHeight },
            photoPosition: { x: photoX, y: photoY },
            transform: { scale: userScale, offsetX: userOffsetX, offsetY: userOffsetY },
            canvas: { width: canvas.width, height: canvas.height },
            originalPhoto: { width: photoImg.width, height: photoImg.height }
          });
          
          // Draw photo INSIDE the clipped area ONLY
          // Photo will respect user transform (scale and position)
          if (transform.mirror) {
            ctx.save();
            ctx.translate(
              Math.round(photoX) + Math.round(scaledPhotoWidth),
              Math.round(photoY)
            );
            ctx.scale(-1, 1);
            ctx.drawImage(
              photoImg,
              0,
              0,
              photoImg.width,
              photoImg.height,
              0,
              0,
              Math.round(scaledPhotoWidth),
              Math.round(scaledPhotoHeight)
            );
            ctx.restore();
          } else {
            ctx.drawImage(
              photoImg,
              0,                       // Source X (full photo, no cropping)
              0,                       // Source Y (full photo, no cropping)
              photoImg.width,         // Source width (full photo width)
              photoImg.height,        // Source height (full photo height)
              Math.round(photoX),     // Destination X (with user offset)
              Math.round(photoY),     // Destination Y (with user offset)
              Math.round(scaledPhotoWidth),   // Destination width (with user scale)
              Math.round(scaledPhotoHeight)  // Destination height (with user scale)
            );
          }
          
          // Restore context - remove clipping region
          ctx.restore();

          // STEP 2: Draw template ON TOP of photo (this is the frame/overlay)
          // The template's solid areas will cover parts of the photo,
          // and transparent/empty areas will show the photo behind
          ctx.drawImage(templateImg, 0, 0);

          // Convert to data URL (format: PNG to preserve transparency)
          // PNG is important here to preserve template's transparent areas
          const mergedDataUrl = canvas.toDataURL("image/png", 1.0);
          
          // Apply grayscale filter first, then grain effect
          applyGrayscaleFilter(mergedDataUrl)
            .then((grayscaleResult) => {
              // Apply grain effect (5%) after grayscale
              return applyGrainFilter(grayscaleResult, 0.05);
            })
            .then((finalResult) => {
              resolve(finalResult);
            })
            .catch((error) => {
              console.error("Error applying filters:", error);
              // If filters fail, return original merged image
              resolve(mergedDataUrl);
            });
          return;
        }
        
        // Fallback: Default position: center of template with some padding
        // WARNING: This should not be used if photoPosition is properly detected
        console.warn("[mergePhotoWithTemplate] No photoPosition provided, using fallback centered position");
        const photoAspectRatio = photoImg.width / photoImg.height;
        const maxPhotoWidth = canvas.width * 0.8;
        const maxPhotoHeight = canvas.height * 0.6;
        
        let photoWidth = maxPhotoWidth;
        let photoHeight = maxPhotoWidth / photoAspectRatio;
        
        if (photoHeight > maxPhotoHeight) {
          photoHeight = maxPhotoHeight;
          photoWidth = maxPhotoHeight * photoAspectRatio;
        }
        
        const defaultPosition = {
          x: (canvas.width - photoWidth) / 2,
          y: canvas.height * 0.15, // 15% from top
          width: photoWidth,
          height: photoHeight,
        };

        // STEP 1: Draw photo first (as background layer)
        ctx.drawImage(
          photoImg,
          defaultPosition.x,
          defaultPosition.y,
          defaultPosition.width,
          defaultPosition.height
        );

        // STEP 2: Draw template ON TOP of photo (this is the frame/overlay)
        ctx.drawImage(templateImg, 0, 0);

        // Convert to data URL (format: PNG to preserve transparency)
        const mergedDataUrl = canvas.toDataURL("image/png", 1.0);
        
        // Apply grayscale filter first, then grain effect
        applyGrayscaleFilter(mergedDataUrl)
          .then((grayscaleResult) => {
            // Apply grain effect (5%) after grayscale
            return applyGrainFilter(grayscaleResult, 0.05);
          })
          .then((finalResult) => {
            resolve(finalResult);
          })
          .catch((error) => {
            console.error("Error applying filters:", error);
            // If filters fail, return original merged image
            resolve(mergedDataUrl);
          });
      };

      photoImg.onerror = () => {
        reject(new Error("Failed to load photo image"));
      };

      photoImg.src = photoImageUrl;
    };

    templateImg.onerror = () => {
      reject(new Error("Failed to load template image"));
    };

    templateImg.src = templateImageUrl;
  });
}
