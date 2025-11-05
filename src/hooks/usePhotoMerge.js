import { useState } from "react";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { calculatePhotoPosition, dataURLtoBlob } from "@/lib/utils";
import { templates, PRINT_CONFIG } from "@/lib/templates";

/**
 * Custom hook for merging photos with templates
 */
export function usePhotoMerge() {
  const [mergedImage, setMergedImage] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const mergePhoto = async (photoUrl, templateId) => {
    if (!templateId || !photoUrl) {
      setError("Template ID and photo URL are required");
      return null;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      setError("Template not found");
      return null;
    }

    setIsMerging(true);
    setError(null);

    try {
      const photoPosition = calculatePhotoPosition(
        template.photoArea,
        PRINT_CONFIG.DPI,
        PRINT_CONFIG.INCH_TO_CM
      );

      const merged = await mergePhotoWithTemplate({
        templateImageUrl: template.templateImage || template.previewImage,
        photoImageUrl: photoUrl,
        templateDimensions: template.dimensions,
        photoPosition,
      });

      setMergedImage(merged);

      // Create download URL
      const blob = dataURLtoBlob(merged);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      return merged;
    } catch (err) {
      console.error("Error merging photo:", err);
      setError(err.message || "Failed to merge photo with template");
      return null;
    } finally {
      setIsMerging(false);
    }
  };

  const reset = () => {
    setMergedImage(null);
    setDownloadUrl(null);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  return {
    mergedImage,
    isMerging,
    downloadUrl,
    error,
    mergePhoto,
    reset,
  };
}

