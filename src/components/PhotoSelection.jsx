import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { templates } from "@/lib/templates";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { calculatePhotoPosition } from "@/lib/utils";
import { PRINT_CONFIG } from "@/lib/templates";
import PageLayout from "./common/PageLayout";
import PhotoGrid from "./common/PhotoGrid";
import PhotoEditor from "./common/PhotoEditor";

export default function PhotoSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, photos } = location.state || {};

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const mergeTimeoutRef = useRef(null);
  const isMergingRef = useRef(false);
  
  // Photo editor state (position and scale)
  const [photoTransform, setPhotoTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    if (!templateId || !photos || photos.length === 0) {
      navigate("/templates");
    }
  }, [templateId, photos, navigate]);

  const template = templates.find((t) => t.id === templateId);

  const mergePhotoWithTransform = useCallback(async (photoUrl, transform) => {
    if (!templateId || !photoUrl || !template) {
      console.error("Missing required data for merge:", { templateId, photoUrl: !!photoUrl, template: !!template });
      return;
    }

    // Prevent multiple simultaneous merges
    if (isMergingRef.current) {
      console.log("Merge already in progress, skipping...");
      return;
    }

    isMergingRef.current = true;
    setIsMerging(true);
    
    try {
      const photoPosition = calculatePhotoPosition(
        template.photoArea,
        PRINT_CONFIG.DPI,
        PRINT_CONFIG.INCH_TO_CM
      );

      console.log("Starting merge with:", {
        templateId,
        photoUrl: photoUrl.substring(0, 50) + "...",
        photoPosition,
        templateDimensions: template.dimensions,
        transform
      });

      const merged = await mergePhotoWithTemplate({
        templateImageUrl: template.templateImage || template.previewImage,
        photoImageUrl: photoUrl,
        templateDimensions: template.dimensions,
        photoPosition,
        photoTransform: transform,
      });

      if (!merged) {
        console.error("mergePhotoWithTemplate returned null/undefined");
        throw new Error("Merge failed: no result");
      }

      console.log("Merge successful, setting mergedImage");
      setMergedImage(merged);

      // Create download URL
      const blob = await fetch(merged).then((r) => r.blob());
      const blobUrl = URL.createObjectURL(blob);
      
      // Revoke old URL if exists
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      
      setDownloadUrl(blobUrl);
      console.log("mergePhotoWithTransform completed successfully");
    } catch (error) {
      console.error("Error merging photo:", error);
      // Don't clear mergedImage on error, keep previous one if exists
    } finally {
      setIsMerging(false);
      isMergingRef.current = false;
    }
  }, [templateId, template, downloadUrl]);

  const handlePhotoSelect = async (index) => {
    console.log("handlePhotoSelect called with index:", index);
    setSelectedPhotoIndex(index);
    setSelectedPhoto(photos[index]);
    // Reset transform when selecting new photo
    const resetTransform = { scale: 1, offsetX: 0, offsetY: 0 };
    setPhotoTransform(resetTransform);
    
    // Clear any pending merges
    if (mergeTimeoutRef.current) {
      clearTimeout(mergeTimeoutRef.current);
      mergeTimeoutRef.current = null;
    }
    
    // Clear previous merged image when selecting new photo
    setMergedImage(null);
    
    if (templateId && photos?.[index] && template) {
      try {
        // Wait a bit to ensure PhotoEditor is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("Calling mergePhotoWithTransform for photo index:", index);
        await mergePhotoWithTransform(photos[index], resetTransform);
      } catch (error) {
        console.error("Error in handlePhotoSelect:", error);
      }
    } else {
      console.warn("Cannot merge - missing data:", { templateId, photoIndex: index, hasTemplate: !!template });
    }
  };

  const handlePhotoTransformChange = useCallback((transform) => {
    // Only update if transform actually changed
    if (
      Math.abs(transform.scale - photoTransform.scale) < 0.01 &&
      Math.abs(transform.offsetX - photoTransform.offsetX) < 1 &&
      Math.abs(transform.offsetY - photoTransform.offsetY) < 1
    ) {
      return; // No significant change, skip update
    }
    
    setPhotoTransform(transform);
    
    // Clear any existing timeout
    if (mergeTimeoutRef.current) {
      clearTimeout(mergeTimeoutRef.current);
    }
    
    // Don't merge if already merging
    if (isMergingRef.current) {
      return;
    }
    
    // Only merge if we have a selected photo
    if (selectedPhoto && !isMergingRef.current) {
      // Use a delay to batch rapid changes - only merge when user stops interacting
      mergeTimeoutRef.current = setTimeout(() => {
        if (!isMergingRef.current) {
          mergePhotoWithTransform(selectedPhoto, transform);
        }
        mergeTimeoutRef.current = null;
      }, 800); // Longer delay to wait for user to finish
    }
  }, [selectedPhoto, mergePhotoWithTransform, photoTransform]);

  // Cleanup timeout and URLs on unmount
  useEffect(() => {
    return () => {
      if (mergeTimeoutRef.current) {
        clearTimeout(mergeTimeoutRef.current);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleNext = () => {
    if (mergedImage && downloadUrl && selectedPhoto) {
      navigate("/preview-print", {
        state: { templateId, mergedImage, downloadUrl, selectedPhoto },
      });
    }
  };

  const handleBack = () => {
    navigate("/camera", { state: { templateId } });
  };

  return (
    <PageLayout>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-white hover:text-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">Pilih Foto Terbaik</h1>
          <p className="text-muted-foreground mt-2 text-white">
            Pilih satu foto yang akan digunakan untuk photostrip
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photo Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Foto Anda</h2>
            <PhotoGrid
              photos={photos}
              selectedIndex={selectedPhotoIndex}
              onPhotoSelect={handlePhotoSelect}
              gridCols={2}
              className="mb-6"
            />
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Preview</h2>

            {selectedPhotoIndex === null ? (
              <div className="flex items-center justify-center h-96 bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg">
                <p className="text-white text-center">
                  Pilih foto terlebih dahulu untuk melihat preview
                </p>
              </div>
            ) : isMerging ? (
              <div className="flex flex-col items-center justify-center h-96 bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
                <p className="text-white">Menggabungkan foto dengan template...</p>
              </div>
            ) : selectedPhoto && template ? (
              <div className="space-y-6">
                {/* Photo Preview - No editing features */}
                <PhotoEditor
                  photoUrl={selectedPhoto}
                  templateUrl={template.templateImage || template.previewImage}
                  photoArea={template.previewArea || template.photoArea}
                  templateDimensions={template.dimensions}
                  onPhotoChange={undefined}
                  initialScale={1}
                  initialX={0}
                  initialY={0}
                />

                <Button 
                  onClick={handleNext} 
                  className="w-full" 
                  size="lg" 
                  disabled={!mergedImage || isMerging}
                >
                  {isMerging ? "Menggabungkan..." : mergedImage ? "Lanjut ke Print" : "Menunggu..."}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg">
                <p className="text-white text-center">
                  Pilih foto terlebih dahulu untuk melihat preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
