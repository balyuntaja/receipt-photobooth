import { useRef, useEffect } from "react";
import { PRINT_CONFIG } from "@/lib/templates";

/**
 * Simple photo preview component that displays photo inside template using Canvas
 * No editing features - just displays the merged result
 */
export default function PhotoEditor({
  photoUrl,
  templateUrl,
  photoArea,
  templateDimensions,
  onPhotoChange,
  initialScale = 1,
  initialX = 0,
  initialY = 0,
  className = "",
  mirror = false,
}) {
  const canvasRef = useRef(null);
  const templateImgRef = useRef(null);
  const photoImgRef = useRef(null);
  const photoAreaRef = useRef(photoArea);
  const templateDimensionsRef = useRef(templateDimensions);
  const mirrorRef = useRef(mirror);

  // Update refs when props change
  useEffect(() => {
    photoAreaRef.current = photoArea;
    templateDimensionsRef.current = templateDimensions;
  }, [photoArea, templateDimensions]);

  useEffect(() => {
    mirrorRef.current = mirror;
    drawToCanvas();
  }, [mirror]);

  // Draw to canvas function - defined before useEffect that uses it
  const drawToCanvas = () => {
    const canvas = canvasRef.current;
    const templateImg = templateImgRef.current;
    const photoImg = photoImgRef.current;
    
    if (!canvas || !templateImg || !photoImg || !photoAreaRef.current) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match template
    const templateWidth = templateImg.naturalWidth || templateImg.width;
    const templateHeight = templateImg.naturalHeight || templateImg.height;
    
    if (templateWidth === 0 || templateHeight === 0) return;
    
    canvas.width = templateWidth;
    canvas.height = templateHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate photo area in canvas pixels
    const PIXELS_PER_CM = PRINT_CONFIG.DPI / PRINT_CONFIG.INCH_TO_CM;
    const photoArea = photoAreaRef.current;
    const areaX = photoArea.x * PIXELS_PER_CM;
    const areaY = photoArea.y * PIXELS_PER_CM;
    const areaWidth = photoArea.width * PIXELS_PER_CM;
    const areaHeight = photoArea.height * PIXELS_PER_CM;

    // Calculate photo size to fill the previewArea exactly (cover mode)
    const photoAspectRatio = photoImg.width / photoImg.height;
    const areaAspectRatio = areaWidth / areaHeight;
    
    let finalPhotoWidth = areaWidth;
    let finalPhotoHeight = areaHeight;

    // Adjust to maintain photo aspect ratio (cover mode - fill area completely)
    if (photoAspectRatio > areaAspectRatio) {
      // Photo is wider - fit by height, crop width
      finalPhotoHeight = areaHeight;
      finalPhotoWidth = areaHeight * photoAspectRatio;
    } else {
      // Photo is taller - fit by width, crop height
      finalPhotoWidth = areaWidth;
      finalPhotoHeight = areaWidth / photoAspectRatio;
    }

    // Apply user scale if provided
    const scaledPhotoWidth = finalPhotoWidth * initialScale;
    const scaledPhotoHeight = finalPhotoHeight * initialScale;

    // Calculate base position - center photo within the previewArea
    // Since photo uses cover mode, center it within the area
    const baseX = areaX + (areaWidth - finalPhotoWidth) / 2;
    const baseY = areaY + (areaHeight - finalPhotoHeight) / 2;

    // Apply user offset and scale adjustment
    const scaleAdjustmentX = (scaledPhotoWidth - finalPhotoWidth) / 2;
    const scaleAdjustmentY = (scaledPhotoHeight - finalPhotoHeight) / 2;
    
    const photoX = baseX + initialX - scaleAdjustmentX;
    const photoY = baseY + initialY - scaleAdjustmentY;

    // STEP 1: Draw photo FIRST (as background layer)
    ctx.save();
    
    // Create clipping rectangle for photo area
    ctx.beginPath();
    ctx.rect(
      Math.round(areaX),
      Math.round(areaY),
      Math.round(areaWidth),
      Math.round(areaHeight)
    );
    ctx.clip();
    
    // Draw photo inside the clipped area
    if (photoImg.complete && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
      // Apply grayscale filter to photo before drawing
      ctx.save();
      ctx.filter = "grayscale(100%)";
      
      if (mirrorRef.current) {
        ctx.save();
        ctx.translate(
          Math.round(photoX) + Math.round(scaledPhotoWidth),
          Math.round(photoY)
        );
        ctx.scale(-1, 1);
        ctx.drawImage(
          photoImg,
          0, 0, photoImg.naturalWidth, photoImg.naturalHeight,
          0,
          0,
          Math.round(scaledPhotoWidth),
          Math.round(scaledPhotoHeight)
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          photoImg,
          0, 0, photoImg.naturalWidth, photoImg.naturalHeight,
          Math.round(photoX),
          Math.round(photoY),
          Math.round(scaledPhotoWidth),
          Math.round(scaledPhotoHeight)
        );
      }
      
      ctx.restore(); // Restore filter
    }

    ctx.restore();

    // STEP 2: Draw template ON TOP of photo
    ctx.globalCompositeOperation = "source-over";
    
    if (templateImg.complete && templateImg.naturalWidth > 0 && templateImg.naturalHeight > 0) {
      ctx.drawImage(templateImg, 0, 0);
    }

    // STEP 3: Apply grain effect (5%) to the entire canvas
    // Get image data and add noise
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const noiseRange = 255 * 0.05; // 5% grain intensity
    
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

    // Notify parent that photo is displayed (for merging)
    // Only notify once when canvas is drawn, not on every render
    // Remove this to prevent infinite loop - merging is handled by PhotoSelection
  };

  // Load images and draw when ready
  useEffect(() => {
    if (!templateUrl || !photoUrl) return;

    let templateImgLoaded = false;
    let photoImgLoaded = false;

    const checkAndDraw = () => {
      if (templateImgLoaded && photoImgLoaded) {
        requestAnimationFrame(() => {
          drawToCanvas();
        });
      }
    };

    const templateImg = new Image();
    if (!templateUrl.startsWith("data:")) {
      templateImg.crossOrigin = "anonymous";
    }
    templateImg.onload = () => {
      templateImgRef.current = templateImg;
      templateImgLoaded = true;
      checkAndDraw();
    };
    templateImg.onerror = () => {
      console.error("Failed to load template image");
    };
    templateImg.src = templateUrl;

    const photoImg = new Image();
    if (!photoUrl.startsWith("data:")) {
      photoImg.crossOrigin = "anonymous";
    }
    photoImg.onload = () => {
      photoImgRef.current = photoImg;
      photoImgLoaded = true;
      checkAndDraw();
    };
    photoImg.onerror = () => {
      console.error("Failed to load photo image");
    };
    photoImg.src = photoUrl;
  }, [templateUrl, photoUrl]);

  return (
    <div className={`relative bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Canvas Container */}
      <div className="relative w-full h-96 flex items-center justify-center" style={{ touchAction: "none", overflow: "hidden" }}>
        {!photoUrl || !templateUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 pointer-events-none">
            <p>No photo or template selected</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full select-none"
            style={{
              maxHeight: "384px",
              maxWidth: "100%",
              width: "auto",
              height: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    </div>
  );
}
