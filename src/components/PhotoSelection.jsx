import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { templates } from "@/lib/templates";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { calculatePhotoPosition } from "@/lib/utils";
import { PRINT_CONFIG } from "@/lib/templates";
import { COLORS } from "@/lib/constants";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { dataURLtoFile } from "@/lib/api";
import { printPhotostripFromFile, isPrinterConnected as checkPrinterConnected } from "@/lib/printer";
import PageLayout from "./common/PageLayout";
import PhotoGrid from "./common/PhotoGrid";
import PhotoEditor from "./common/PhotoEditor";

export default function PhotoSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, photos, printCount: initialPrintCount } = location.state || {};
  const printCount = initialPrintCount || 1; // Get from state, default to 1

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const mergeTimeoutRef = useRef(null);
  const isMergingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [printError, setPrintError] = useState(null);

  // Photo editor state (position and scale)
  const [photoTransform, setPhotoTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Upload hook
  const {
    sessionId,
    uploadFilesDirect,
    uploadError,
  } = usePhotoUpload();

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
      // Use previewArea for preview consistency (same as PhotoEditor)
      const photoArea = template.previewArea || template.photoArea;
      const photoPosition = calculatePhotoPosition(
        photoArea,
        PRINT_CONFIG.DPI,
        PRINT_CONFIG.INCH_TO_CM
      );

      console.log("Starting merge with:", {
        templateId,
        photoUrl: photoUrl.substring(0, 50) + "...",
        photoPosition,
        photoArea: photoArea,
        templateDimensions: template.dimensions,
        transform
      });

      const merged = await mergePhotoWithTemplate({
        templateImageUrl: template.templateImage || template.previewImage,
        photoImageUrl: photoUrl,
        templateDimensions: template.dimensions,
        photoPosition,
        photoTransform: { ...transform, mirror: isMirrored },
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
  }, [templateId, template, downloadUrl, isMirrored]);

  const handlePhotoSelect = async (index) => {
    console.log("handlePhotoSelect called with index:", index);
    setSelectedPhotoIndex(index);
    setSelectedPhoto(photos[index]);
    // Reset transform when selecting new photo
    const resetTransform = { scale: 1, offsetX: 0, offsetY: 0 };
    setPhotoTransform(resetTransform);
    setIsMirrored(false);
    
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
  useEffect(() => {
    if (selectedPhoto) {
      mergePhotoWithTransform(selectedPhoto, photoTransform);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMirrored]);


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


  const handleNext = async () => {
    if (!mergedImage || !downloadUrl || selectedPhotoIndex === null) {
      return;
    }

    // Prepare files for upload (photostrip + ordered photos)
    const orderedPhotos = photos && photos.length > 0
      ? [photos[selectedPhotoIndex], ...photos.filter((_, idx) => idx !== selectedPhotoIndex)]
      : [];

    setIsUploading(true);
    setPrintError(null);

    try {
      const filesToUpload = [];

      // Photostrip as the first file
      const photostripFile = dataURLtoFile(mergedImage, `photostrip-${sessionId}.png`);
      filesToUpload.push(photostripFile);

      // Original photos (selected first, then the rest) so backend receives consistent order
      orderedPhotos.forEach((photoDataUrl, index) => {
        const photoFile = dataURLtoFile(photoDataUrl, `photo-${index + 1}.png`);
        filesToUpload.push(photoFile);
      });

      if (filesToUpload.length > 0) {
        console.log("Uploading files before preview:", filesToUpload.map(f => ({ name: f.name, type: f.type, size: f.size })));
        const result = await uploadFilesDirect(filesToUpload);
        if (result && result.success) {
          sessionStorage.setItem(`uploaded_${sessionId}`, "true");
          console.log("Upload successful. Backend will generate GIF from uploaded photos.");
        } else {
          console.warn("Upload failed before preview:", result?.message);
        }
      }

      // Print photostrip
      if (checkPrinterConnected()) {
        setIsPrinting(true);
        try {
          await printPhotostripFromFile(photostripFile, printCount);
          console.log(`Printed ${printCount} copy/copies successfully`);
        } catch (printErr) {
          console.error("Print error:", printErr);
          const errorMessage = printErr instanceof Error ? printErr.message : "Gagal mencetak foto";
          setPrintError(errorMessage);
        } finally {
          setIsPrinting(false);
        }
      }
    } catch (error) {
      console.error("Upload error before preview:", error);
    } finally {
      setIsUploading(false);

      // Navigate to preview regardless of upload/print result
      navigate("/preview-print", {
        state: { templateId, mergedImage, downloadUrl, selectedPhoto, photos, isMirrored, printCount },
      });
    }
  };

  const handleBack = () => {
    navigate("/camera", { state: { templateId, printCount } });
  };

  const isShortScreen = typeof window !== 'undefined' && window.innerHeight < 650;
  const scale = isShortScreen ? 0.85 : 1;

  return (
    <PageLayout>
      <div className="flex items-center justify-center px-4 py-4">
        <div
          className="container mx-auto max-w-6xl photo-selection-container relative w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {/* Header */}
          {/* Small tablet: Header lebih kompak untuk muat dalam satu layar */}
          <div className={`photo-selection-header ${isShortScreen ? 'mb-4' : 'mb-6'}`}>
            <Button
              variant="ghost"
              onClick={handleBack}
              className={`${isShortScreen ? 'mb-2' : 'mb-4'} text-white hover:text-white/80`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className={`${isShortScreen ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
              Pilih Satu Foto Terbaik
            </h1>
          </div>

          {/* Grid layout: Preview selalu di sebelah kanan, mirip tampilan desktop */}
          <div className="grid grid-cols-2 gap-8 photo-selection-grid">
          {/* Photo Selection */}
          <div>
            <h2 className={`${isShortScreen ? 'text-lg' : 'text-xl'} font-semibold ${isShortScreen ? 'mb-2' : 'mb-4'} text-white`}>
              Foto Anda
            </h2>
            <PhotoGrid
              photos={photos}
              selectedIndex={selectedPhotoIndex}
              onPhotoSelect={handlePhotoSelect}
              className="max-w-1000"
            />
          </div>

          {/* Preview */}
          {/* Tablet: Preview area dengan max-height untuk memastikan tombol Print tetap terlihat */}
          <div className="photo-selection-preview">
            <h2 className={`${isShortScreen ? 'text-lg' : 'text-xl'} font-semibold ${isShortScreen ? 'mb-2' : 'mb-4'} text-white`}>
              Preview
            </h2>

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
              // Preview controls - styling mirip desktop
              <div className={`${isShortScreen ? 'space-y-3' : 'space-y-4'} photo-selection-controls`}>
                {/* Photo Preview - No editing features */}
                <div className="photo-selection-editor">
                  <PhotoEditor
                    photoUrl={selectedPhoto}
                    templateUrl={template.templateImage || template.previewImage}
                    photoArea={template.previewArea || template.photoArea}
                    templateDimensions={template.dimensions}
                    onPhotoChange={undefined}
                    initialScale={1}
                    initialX={0}
                    initialY={0}
                    mirror={isMirrored}
                  />
                </div>

                {isUploading && (
                  <div className="bg-blue-500/20 border border-blue-500 text-blue-200 p-2 rounded-lg text-xs flex items-center gap-2 photo-selection-status">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Mengupload ke cloud...
                  </div>
                )}

                {isPrinting && (
                  <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-2 rounded-lg text-xs flex items-center gap-2 photo-selection-status">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Mencetak {printCount} salinan...
                  </div>
                )}

                {printError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 rounded-lg text-xs photo-selection-status">
                    {printError}
                  </div>
                )}

                {/* Small tablet: Mirror toggle lebih kompak */}
                <div className="flex items-center justify-center gap-2 text-white/80 photo-selection-mirror">
                  <button
                    type="button"
                    onClick={() => setIsMirrored((prev) => !prev)}
                    className="relative inline-flex h-7 w-14 items-center rounded-full border border-white/20 transition-colors duration-300"
                    style={{ backgroundColor: isMirrored ? COLORS.PRIMARY : 'rgba(255,255,255,0.25)' }}
                  >
                    <span className="sr-only">Mirror image</span>
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                        isMirrored ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`${isShortScreen ? 'text-xs' : 'text-xs'} font-semibold uppercase tracking-wide`}>
                    Mirror image
                  </span>
                </div>

                {/* Print Count Display (Read-only) */}
                <div className={`flex flex-col items-center ${isShortScreen ? 'gap-2' : 'gap-3'}`}>
                  <span className={`${isShortScreen ? 'text-xs' : 'text-sm'} font-medium text-white/80`}>
                    Jumlah Print
                  </span>
                  <div className="flex items-center justify-center">
                    <span className={`${isShortScreen ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
                      {printCount}
                    </span>
                  </div>
                </div>
                
                {/* Small tablet: Button lebih kompak */}
                <Button 
                  onClick={handleNext} 
                  className={`w-full photo-selection-button ${isShortScreen ? 'mt-2' : 'mt-4'}`}
                  size={isShortScreen ? "default" : "lg"}
                  disabled={!mergedImage || isMerging || isUploading || isPrinting}
                >
                  {isMerging ? (
                    "Menggabungkan..."
                  ) : isUploading ? (
                    "Mengupload..."
                  ) : isPrinting ? (
                    "Mencetak..."
                  ) : mergedImage ? (
                    "Lanjut ke Print"
                  ) : (
                    "Menunggu..."
                  )}
                </Button>
                {uploadError && (
                  <p className="text-red-400 text-xs mt-1">{uploadError}</p>
                )}
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
      </div>
    </PageLayout>
  );
}
