import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { RotateCcw, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PRINT_DIMENSIONS } from "@/lib/templates";
import { templates } from "@/lib/templates";
import { DELAYS } from "@/lib/constants";
import { PRINT_CONFIG } from "@/lib/templates";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { calculatePhotoPosition } from "@/lib/utils";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import PageLayout from "./common/PageLayout";
import PhotoEditor from "./common/PhotoEditor";

export default function PreviewPrint() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, mergedImage, downloadUrl, selectedPhoto, photos, isMirrored } = location.state || {};
  const containerRef = useRef(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const { sessionId, resetSession } = usePhotoUpload();

  useEffect(() => {
    if (!mergedImage || !downloadUrl || !templateId) {
      navigate("/templates");
    }
  }, [mergedImage, downloadUrl, templateId, navigate]);

  const template = templates.find((t) => t.id === templateId);

  const handlePrint = async () => {
    if (!mergedImage) return;

    setIsPrinting(true);
    setPrintError(null);

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
      }

      const printHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Photostrip</title>
            <style>
              @media print {
                @page {
                  size: ${PRINT_DIMENSIONS.widthCM}cm ${PRINT_DIMENSIONS.heightCM}cm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  width: ${PRINT_DIMENSIONS.widthCM}cm;
                  height: ${PRINT_DIMENSIONS.heightCM}cm;
                  display: block;
                  object-fit: contain;
                }
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: ${PRINT_DIMENSIONS.widthCM}cm;
                height: ${PRINT_DIMENSIONS.heightCM}cm;
                display: block;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${mergedImage}" alt="Photostrip" />
          </body>
        </html>
      `;
      printWindow.document.write(printHTML);
      printWindow.document.close();

      await new Promise((resolve) => {
        printWindow.onload = resolve;
        setTimeout(resolve, DELAYS.PRINT_LOAD);
      });

      printWindow.print();

      setTimeout(() => {
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("Print error:", error);
      setPrintError(
        error instanceof Error
          ? error.message
          : "Gagal mencetak. Pastikan printer sudah terhubung."
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const qrCodeUrl = sessionId
    ? `${window.location.origin}/photo-result?sessionId=${sessionId}`
    : "https://example.com/photostrip-dummy";

  useEffect(() => {
    const uploaded = sessionStorage.getItem(`uploaded_${sessionId}`);
    if (uploaded === "true") setIsUploaded(true);
  }, [sessionId]);

  const downloadCanvas = (canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `photostrip-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  };

  const handleDownload = async () => {
    if (!selectedPhoto || !template) return;

    try {
      const photoArea = template.previewArea || template.photoArea;
      const photoPosition = calculatePhotoPosition(
        photoArea,
        PRINT_CONFIG.DPI,
        PRINT_CONFIG.INCH_TO_CM
      );

      const merged = await mergePhotoWithTemplate({
        templateImageUrl: template.templateImage || template.previewImage,
        photoImageUrl: selectedPhoto,
        templateDimensions: template.dimensions,
        photoPosition,
        photoTransform: {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          mirror: isMirrored,
        },
      });

      if (!merged) {
        console.error("Failed to merge photo for download");
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        downloadCanvas(canvas);
      };
      img.src = merged;
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleNewSession = () => {
    resetSession();
    if (sessionId) sessionStorage.removeItem(`uploaded_${sessionId}`);
    navigate("/");
  };

  if (!templateId || !template) {
    return (
      <PageLayout containerRef={containerRef}>
        <div className="flex items-center justify-center h-full px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-white text-lg">Loading...</p>
            <Button onClick={() => navigate("/templates")} className="mt-4">
              Back to Templates
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!mergedImage) {
    return (
      <PageLayout containerRef={containerRef}>
        <div className="flex items-center justify-center h-full px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-white text-lg mb-4">No merged image found</p>
            <Button
              onClick={() =>
                navigate("/select-photo", { state: { templateId, photos } })
              }
              className="mt-4"
            >
              Back to Photo Selection
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isShortScreen = typeof window !== 'undefined' && window.innerHeight < 650;
  const scale = isShortScreen ? 0.85 : 1;

  return (
    <PageLayout containerRef={containerRef}>
      <div className="flex items-center justify-center h-full px-4 py-4">
        <div
          className="container mx-auto max-w-6xl preview-print-container relative w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {/* Header */}
          <div className={`text-center preview-print-header ${isShortScreen ? 'mb-4' : 'mb-6'}`}>
            <h1 className={`${isShortScreen ? 'text-2xl' : 'text-3xl'} font-bold mb-1 text-white`}>
              Preview & Print
            </h1>
            <p className={`${isShortScreen ? 'text-sm' : 'text-base'} text-muted-foreground text-white`}>
              Silakan cetak atau unduh hasil photostrip Anda
            </p>
          </div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-6 preview-print-grid">
            {/* Left: Photostrip Preview */}
            <div>
              <h2 className={`${isShortScreen ? 'text-lg' : 'text-xl'} font-semibold mb-3 text-white`}>
                Hasil Photostrip
              </h2>

              <div className="space-y-2">
                {selectedPhoto ? (
                  <PhotoEditor
                    className="py-2"
                    photoUrl={selectedPhoto}
                    templateUrl={template.templateImage || template.previewImage}
                    photoArea={template.previewArea || template.photoArea}
                    templateDimensions={template.dimensions}
                    mirror={isMirrored}
                  />
                ) : (
                  <div className="relative bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-4">
                      <img
                        src={mergedImage}
                        alt="Photostrip result"
                        className="w-full h-auto object-contain"
                        style={{
                          maxHeight: isShortScreen ? '220px' : '280px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {printError && (
                  <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                    <p className="text-sm">{printError}</p>
                  </div>
                )}

                {isUploaded && (
                  <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded-lg text-sm flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Photos and GIF sudah di-upload! Scan QR code untuk melihat hasil.
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4 max-w-[340px] w-full mx-auto lg:mx-0 lg:pl-6">
              <h2 className={`${isShortScreen ? 'text-lg' : 'text-xl'} font-semibold text-white`}>
                Download Digital
              </h2>

              <div className="bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg p-6 flex flex-col items-center max-w-[340px] w-full mx-auto lg:mx-0">
                <p className="text-sm text-white/70 mb-4 text-center max-w-xs">
                  Scan QR Code ini untuk mengunduh foto
                </p>

                <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={isShortScreen ? 180 : 250}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {sessionId && (
                  <p className="text-xs text-white/50 mt-2 text-center max-w-xs font-mono">
                    Session ID: {sessionId.substring(0, 20)}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleNewSession}
                className="w-full"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
