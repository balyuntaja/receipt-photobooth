import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Camera } from "lucide-react";
import { templates } from "@/lib/templates";
import { CONFIG } from "@/lib/constants";
import { useCamera } from "@/hooks/useCamera";
import { usePhotoCapture } from "@/hooks/usePhotoCapture";
import { useCountdown } from "@/hooks/useCountdown";
import PageLayout from "./common/PageLayout";
import CountdownOverlay from "./common/CountdownOverlay";

export default function CameraSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = location.state?.templateId;

  const [photos, setPhotos] = useState([]);
  const [delay] = useState(3);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");

  // Get template
  const template = templates.find((t) => t.id === templateId);

  // Custom hooks
  const { videoRef, error, startCamera, stopCamera } = useCamera(cameraFacingMode);
  const { canvasRef, capturePhoto: capturePhotoFromVideo } = usePhotoCapture();
  const { countdown, startCountdown } = useCountdown(delay);

  // === Navigation ===
  useEffect(() => {
    if (!templateId) {
      navigate("/templates");
    }
  }, [templateId, navigate]);

  // === Take Photo with Countdown ===
  const takePhoto = async () => {
    if (photos.length >= CONFIG.MAX_PHOTOS) {
      console.log(`Cannot take more photos. Current: ${photos.length}, Max: ${CONFIG.MAX_PHOTOS}`);
      return;
    }

    await startCountdown(async () => {
      const video = videoRef.current;
      if (!video) return;

      const dataUrl = capturePhotoFromVideo(video);
      if (dataUrl) {
        setPhotos((prev) => {
          const newPhotos = [...prev, dataUrl];
          console.log(`Photo captured. Total photos: ${newPhotos.length}`);
          return newPhotos;
        });
      }
    });
  };

  const resetPhotos = () => {
    setPhotos([]);
  };

  const handleComplete = () => {
    if (photos.length === CONFIG.MAX_PHOTOS) {
      navigate("/select-photo", {
        state: { templateId, photos },
      });
    }
  };

  const handleBack = () => {
    stopCamera();
    navigate("/templates");
  };

  return (
    <PageLayout className="flex justify-center" showLockButton={true}>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="absolute top-6 left-6 z-10 text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Grid 2 Kolom: Camera View dan Photos Preview */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-7xl mt-16">
        {/* LEFT COLUMN - Camera View */}
        <div className="flex flex-col items-center">
          <div className="relative w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto object-cover rounded-lg"
              style={{ maxHeight: "70vh", minHeight: "500px" }}
            />
            <CountdownOverlay countdown={countdown} />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="w-full mt-6 space-y-3">
            <Button
              onClick={takePhoto}
              disabled={photos.length >= CONFIG.MAX_PHOTOS}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <Camera className="h-5 w-5" />
              Take Photo ({CONFIG.MAX_PHOTOS - photos.length} remaining)
            </Button>

            {photos.length === CONFIG.MAX_PHOTOS && (
              <Button onClick={handleComplete} className="w-full" size="lg">
                Complete {photos.length}/{CONFIG.MAX_PHOTOS} Photos
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Photos Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Photos</h2>
          <div className="text-sm text-white/70">
            {photos.length}/{CONFIG.MAX_PHOTOS} photos captured
          </div>

          {photos.length === 0 ? (
            <div className="text-center text-white/50 text-sm rounded-lg py-6 bg-black/10">
              No Photos Yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => (
                <img
                  key={`photo-${i}-${photo.substring(0, 20)}`}
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="rounded-lg w-full object-contain"
                  style={{ maxHeight: "200px", width: "100%" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-destructive text-white p-6 rounded-lg max-w-md mx-4">
            <p className="mb-4">{error}</p>
            <Button onClick={startCamera}>Coba Lagi</Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
