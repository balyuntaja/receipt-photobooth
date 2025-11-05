import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Printer, Download, RotateCcw, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PRINT_DIMENSIONS } from "@/lib/templates";
import { templates } from "@/lib/templates";
import { DELAYS } from "@/lib/constants";
import { PRINT_CONFIG } from "@/lib/templates";
import { mergePhotoWithTemplate } from "@/lib/image-processing";
import { calculatePhotoPosition } from "@/lib/utils";
import PageLayout from "./common/PageLayout";
import PhotoEditor from "./common/PhotoEditor";
import logo from "@/assets/logo-photomate.png";

export default function PreviewPrint() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, mergedImage, downloadUrl, selectedPhoto } = location.state || {};
  const containerRef = useRef(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);

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

      // Wait for image to load
      await new Promise((resolve) => {
        printWindow.onload = resolve;
        setTimeout(resolve, DELAYS.PRINT_LOAD);
      });

      // Trigger print dialog
      printWindow.print();

      // Close window after print
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

  // Dummy QR Code value (will be replaced with Firebase integration later)
  const dummyQRValue = "https://example.com/photostrip-dummy";

  const downloadCanvas = (canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photostrip-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  };

  const handleDownload = async () => {
    if (!selectedPhoto || !template) return;

    try {
      // Create merge using previewArea (same as what's shown in PhotoEditor preview)
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
        },
      });

      if (!merged) {
        console.error("Failed to merge photo for download");
        return;
      }

      // Create canvas from merged result
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          downloadCanvas(canvas);
        }
      };
      img.onerror = () => {
        console.error("Failed to load merged image for download");
      };
      img.src = merged;
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleNewSession = () => {
    navigate("/");
  };

  if (!mergedImage || !downloadUrl || !templateId || !template) {
    return null;
  }

  return (
    <PageLayout containerRef={containerRef}>
      
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">Preview & Print</h1>
          <p className="text-muted-foreground text-white">
            Silakan cetak atau unduh hasil photostrip Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Image */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Hasil Photostrip</h2>
            <div className="space-y-6">
              {/* Photo Preview - Using PhotoEditor like in PhotoSelection */}
              {selectedPhoto ? (
                <PhotoEditor className="py-6.5"
                  photoUrl={selectedPhoto}
                  templateUrl={template.templateImage || template.previewImage}
                  photoArea={template.previewArea || template.photoArea}
                  templateDimensions={template.dimensions}
                  onPhotoChange={undefined}
                  initialScale={1}
                  initialX={0}
                  initialY={0}
                />
              ) : (
                <div className="relative bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-4">
                    <img
                      src={mergedImage}
                      alt="Photostrip result"
                      className="w-full h-auto"
                      style={{ maxHeight: "600px", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}

              {/* Print Error */}
              {printError && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                  <p className="text-sm">{printError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={handlePrint} disabled={isPrinting} className="flex-1" size="lg">
                  {isPrinting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mencetak...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDownload} className="flex-1" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Download Digital</h2>
            <div className="bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg p-6 flex flex-col items-center">
              <p className="text-sm text-white/70 mb-4 text-center max-w-xs">
                Scan QR Code ini untuk mengunduh file foto digital
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
                <QRCodeSVG 
                  value={dummyQRValue} 
                  size={250} 
                  level="H" 
                  includeMargin={true} 
                />
              </div>
              <p className="text-xs text-white/70 mt-4 text-center max-w-xs">
                Scan QR Code untuk mendapatkan foto digital (tidak perlu internet)
              </p>
            </div>

            <Button variant="outline" onClick={handleNewSession} className="w-full" size="lg">
              <RotateCcw className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
