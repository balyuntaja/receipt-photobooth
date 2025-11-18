import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Camera, RotateCcw } from "lucide-react";
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
  const [delay] = useState(5);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
  const [hasStarted, setHasStarted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const photosRef = useRef([]);
  const captureTimeoutRef = useRef(null);
  const isCapturingRef = useRef(false);
  const isCountdownActiveRef = useRef(false);

  // Get template
  const template = templates.find((t) => t.id === templateId);

  // Custom hooks
  const { videoRef, error, startCamera, stopCamera, isLoading } = useCamera(cameraFacingMode);
  const { canvasRef, capturePhoto: capturePhotoFromVideo } = usePhotoCapture();
  const { countdown, startCountdown } = useCountdown(delay);

  // Sync photosRef with photos state
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // === Navigation ===
  useEffect(() => {
    if (!templateId) {
      navigate("/templates");
    }
  }, [templateId, navigate]);

  // === Start Auto Capture Handler ===
  const handleStart = () => {
    if (!isLoading && !error && videoRef.current && !hasStarted) {
      setHasStarted(true);
      setIsCapturing(true);
      isCapturingRef.current = true;

      const targetPhotos = 3;

      const captureSequence = async () => {
        // Prevent multiple simultaneous captures
        if (isCapturingRef.current === false || isCountdownActiveRef.current === true) {
          return;
        }

        // Check current photo count
        const currentCount = photosRef.current.length;
        
        if (currentCount >= targetPhotos) {
          isCapturingRef.current = false;
          setIsCapturing(false);
          return;
        }

        // Mark countdown as active
        isCountdownActiveRef.current = true;

        try {
          // Start countdown and capture
          await startCountdown(async () => {
            const video = videoRef.current;
            if (!video || !isCapturingRef.current) {
              return;
            }

            const dataUrl = capturePhotoFromVideo(video);
            if (dataUrl) {
              setPhotos((prev) => {
                const newPhotos = [...prev, dataUrl];
                console.log(`Photo captured. Total photos: ${newPhotos.length}`);
                
                // Update ref immediately
                photosRef.current = newPhotos;
                
                // If we've captured 3 photos, stop capturing
                if (newPhotos.length >= targetPhotos) {
                  isCapturingRef.current = false;
                  setIsCapturing(false);
                }
                
                return newPhotos;
              });
            }
          });
        } finally {
          // Mark countdown as inactive after countdown completes
          isCountdownActiveRef.current = false;
          
          // Start next capture if we haven't reached target
          if (isCapturingRef.current && photosRef.current.length < targetPhotos) {
            setTimeout(() => {
              if (isCapturingRef.current && !isCountdownActiveRef.current) {
                captureSequence();
              }
            }, 100);
          }
        }
      };

      // Start first capture after a short delay
      captureTimeoutRef.current = setTimeout(() => {
        captureSequence();
      }, 1000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

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

  const handleNext = () => {
    if (photos.length === 3) {
      navigate("/select-photo", {
        state: { templateId, photos },
      });
    }
  };

  const handleRetake = async (index) => {
    // Prevent retake if countdown is active
    if (countdown !== null || isCountdownActiveRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Mark countdown as active
    isCountdownActiveRef.current = true;

    try {
      // Start countdown and capture
      await startCountdown(async () => {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        const dataUrl = capturePhotoFromVideo(video);
        if (dataUrl) {
          setPhotos((prev) => {
            const newPhotos = [...prev];
            newPhotos[index] = dataUrl;
            console.log(`Photo ${index + 1} retaken`);
            
            // Update ref immediately
            photosRef.current = newPhotos;
            
            return newPhotos;
          });
        }
      });
    } catch (error) {
      console.error("Error retaking photo:", error);
    } finally {
      // Mark countdown as inactive after countdown completes
      isCountdownActiveRef.current = false;
    }
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

      {/* Grid dengan rasio 2:1: Camera View dan Photos Preview */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-7xl mt-16">
        {/* LEFT COLUMN - Camera View (2 bagian) */}
        <div className="col-span-2 flex flex-col items-center">
          <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
            <CountdownOverlay countdown={countdown} />
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* RIGHT COLUMN - Photos Preview (1 bagian) */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-white">Photos</h2>
          <div className="text-sm text-white/70">
            {photos.length}/3 photos captured
          </div>

          {photos.length === 0 ? (
            <div className="text-center text-white/50 text-sm rounded-lg py-6 bg-black/10">
              No Photos Yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => (
                <div
                  key={`photo-${i}-${photo.substring(0, 20)}`}
                  className="relative group"
                >
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="rounded-lg w-full object-contain"
                    style={{ maxHeight: "200px", width: "100%" }}
                  />
                  <button
                    onClick={() => handleRetake(i)}
                    disabled={countdown !== null}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/30 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Retake photo"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Start Overlay - Dark overlay with Start button */}
      {!hasStarted && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
          <Button
            onClick={handleStart}
            className="px-12 py-6 text-xl font-semibold"
            size="lg"
          >
            Start
          </Button>
        </div>
      )}

      {/* Next Button - Show when 3 photos are captured */}
      {photos.length === 3 && (
        <Button
          onClick={handleNext}
          className="absolute bottom-6 right-6 z-10"
          size="lg"
        >
          Selanjutnya
        </Button>
      )}

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
