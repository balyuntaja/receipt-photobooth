import { useEffect, useRef, useState } from "react";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { templates, PRINT_CONFIG } from "@/lib/templates";

export default function PhotoMerge({ photo, templateId = "template-1" }) {
  const canvasRef = useRef(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!photo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find template
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      setError(`Template ${templateId} not found`);
      return;
    }

    setIsMerging(true);
    setError(null);

    // Use the merge function that handles template + photo correctly
    mergePhotoWithTemplate({
      templateImageUrl: template.templateImage || template.previewImage,
      photoImageUrl: photo,
      templateDimensions: template.dimensions,
      photoPosition: template.photoArea ? (() => {
        // Convert cm to pixels using config from templates
        const PIXELS_PER_CM = PRINT_CONFIG.DPI / PRINT_CONFIG.INCH_TO_CM;
        return {
          x: Math.round(template.photoArea.x * PIXELS_PER_CM),
          y: Math.round(template.photoArea.y * PIXELS_PER_CM),
          width: Math.round(template.photoArea.width * PIXELS_PER_CM),
          height: Math.round(template.photoArea.height * PIXELS_PER_CM),
        };
      })() : undefined,
    })
      .then((mergedDataUrl) => {
        // Draw merged result to canvas
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          setIsMerging(false);
        };
        img.onerror = () => {
          setError("Failed to load merged image");
          setIsMerging(false);
        };
        img.src = mergedDataUrl;
      })
      .catch((err) => {
        console.error("Error merging photo:", err);
        setError(err.message || "Failed to merge photo with template");
        setIsMerging(false);
      });
  }, [photo, templateId]);

  if (error) {
    return (
      <div className="w-72 border rounded-lg p-4 text-red-500 text-sm">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="w-72 border rounded-lg"
        style={{ display: isMerging ? "none" : "block" }}
      />
      {isMerging && (
        <div className="w-72 h-72 border rounded-lg flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Merging...</p>
        </div>
      )}
    </div>
  );
}

