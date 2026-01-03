import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ArrowLeft, Camera, RotateCcw, Minus, Plus } from "lucide-react";
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
  const printCount = location.state?.printCount || 1;

  const [photos, setPhotos] = useState([]);
  const [delay] = useState(5);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
  const [hasStarted, setHasStarted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [exposure, setExposure] = useState(50); // 0-100, default 50 (middle)
  const photosRef = useRef([]);
  const captureTimeoutRef = useRef(null);
  const isCapturingRef = useRef(false);
  const isCountdownActiveRef = useRef(false);
  const videoTrackRef = useRef(null);

  // Get template
  const template = templates.find((t) => t.id === templateId);

  // Custom hooks
  // Note: useCamera no longer auto-starts - must be triggered by user gesture
  const { videoRef, error, startCamera, stopCamera, isLoading, isActive, retryCamera } = useCamera();
  const { canvasRef, capturePhoto: capturePhotoFromVideo } = usePhotoCapture();
  const { countdown, startCountdown } = useCountdown(delay);

  // Apply exposure to video track - use useCallback to stabilize function
  // Must be defined before useEffect that uses it
  const applyExposureToTrack = useCallback(async (track, value) => {
    if (!track) return;

    try {
      // Convert 0-100 to exposure compensation range (-2 to 2)
      // 0 = -2 (darker), 50 = 0 (normal), 100 = 2 (brighter)
      const exposureCompensation = ((value - 50) / 50) * 2;
      
      // Try multiple approaches for exposure control
      const constraints = {
        exposureCompensation: exposureCompensation,
      };

      // First try: direct exposureCompensation in advanced
      try {
        await track.applyConstraints({ advanced: [constraints] });
        console.log("Exposure applied via advanced constraints:", exposureCompensation);
        // Don't clear CSS filter - keep it as visual feedback
        return;
      } catch (e) {
        console.log("Advanced constraints failed, trying direct constraint");
      }

      // Second try: direct constraint (not in advanced array)
      try {
        await track.applyConstraints(constraints);
        console.log("Exposure applied via direct constraint:", exposureCompensation);
        // Don't clear CSS filter - keep it as visual feedback
        return;
      } catch (e) {
        console.log("Direct constraint failed, trying exposureMode");
      }

      // Third try: use exposureMode with manual mode
      try {
        await track.applyConstraints({
          exposureMode: "manual",
          exposureCompensation: exposureCompensation,
        });
        console.log("Exposure applied via exposureMode:", exposureCompensation);
        // Don't clear CSS filter - keep it as visual feedback
        return;
      } catch (e) {
        console.warn("Camera exposure API not supported, using CSS filter only");
      }
    } catch (err) {
      console.warn("Exposure adjustment error:", err);
    }
    // Always use CSS filter for visual feedback regardless of API support
  }, []);

  // Get video track for exposure control
  useEffect(() => {
    const updateVideoTrack = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          videoTrackRef.current = tracks[0];
        }
      }
    };

    // Update track when video element or stream changes
    if (videoRef.current && !isLoading) {
      updateVideoTrack();
      // Also listen for loadedmetadata event
      videoRef.current.addEventListener('loadedmetadata', updateVideoTrack);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', updateVideoTrack);
      }
    };
  }, [isLoading]);

  // Apply exposure when exposure value changes
  useEffect(() => {
    // Always apply CSS filter for immediate visual feedback
    if (videoRef.current) {
      // Convert exposure to brightness/contrast
      // 0 = 0.3 brightness (very dark), 50 = 1.0 brightness (normal), 100 = 2.0 brightness (very bright)
      const brightness = 0.3 + (exposure / 100) * 1.7;
      const contrast = 0.7 + (exposure / 100) * 0.6;
      const filterValue = `brightness(${brightness}) contrast(${contrast})`;
      videoRef.current.style.filter = filterValue;
      console.log("CSS filter applied:", filterValue, "exposure:", exposure);
    }
    
    // Also try to apply to camera track if available (non-blocking)
    if (videoTrackRef.current) {
      applyExposureToTrack(videoTrackRef.current, exposure).catch(err => {
        console.warn("Failed to apply exposure to track:", err);
      });
    }
  }, [exposure, applyExposureToTrack]);

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

  // === Start Camera Handler (User Gesture Required) ===
  const handleStartCamera = async () => {
    if (!isActive && !isLoading) {
      await startCamera();
    }
  };

  // === Start Auto Capture Handler ===
  const handleStart = () => {
    // Ensure camera is active before starting capture
    if (!isActive) {
      handleStartCamera();
      return;
    }

    if (!isLoading && !error && videoRef.current && !hasStarted) {
      setHasStarted(true);
      setIsCapturing(true);
      isCapturingRef.current = true;

      const targetPhotos = 1;

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

            const dataUrl = capturePhotoFromVideo(video, exposure);
            if (dataUrl) {
              setPhotos((prev) => {
                const newPhotos = [...prev, dataUrl];
                console.log(`Photo captured with exposure ${exposure}. Total photos: ${newPhotos.length}`);
                
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

      const dataUrl = capturePhotoFromVideo(video, exposure);
      if (dataUrl) {
        setPhotos((prev) => {
          const newPhotos = [...prev, dataUrl];
          console.log(`Photo captured with exposure ${exposure}. Total photos: ${newPhotos.length}`);
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
        state: { templateId, photos, printCount },
      });
    }
  };

  const handleBack = () => {
    stopCamera();
    navigate("/templates", { state: { printCount } });
  };

  const handleNext = () => {
    if (photos.length === 1) {
      navigate("/select-photo", {
        state: { templateId, photos, printCount },
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

        const dataUrl = capturePhotoFromVideo(video, exposure);
        if (dataUrl) {
          setPhotos((prev) => {
            const newPhotos = [...prev];
            newPhotos[index] = dataUrl;
            console.log(`Photo ${index + 1} retaken with exposure ${exposure}`);
            
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


  // Handle exposure change
  const handleExposureChange = (newValue) => {
    setExposure(newValue);
    
    // Immediately apply CSS filter for visual feedback
    if (videoRef.current) {
      // Convert exposure to brightness/contrast with more noticeable range
      // 0 = 0.3 brightness (very dark), 50 = 1.0 brightness (normal), 100 = 2.0 brightness (very bright)
      const brightness = 0.3 + (newValue / 100) * 1.7;
      const contrast = 0.7 + (newValue / 100) * 0.6;
      const filterValue = `brightness(${brightness}) contrast(${contrast})`;
      videoRef.current.style.filter = filterValue;
      console.log("Exposure changed - CSS filter:", filterValue, "value:", newValue);
    }
    
    // Also try to apply to camera track if available (async, non-blocking)
    if (videoTrackRef.current) {
      applyExposureToTrack(videoTrackRef.current, newValue).catch(err => {
        console.warn("Failed to apply exposure to track:", err);
      });
    }
  };

  const handleExposureDecrease = () => {
    const newValue = Math.max(0, exposure - 5);
    handleExposureChange(newValue);
  };

  const handleExposureIncrease = () => {
    const newValue = Math.min(100, exposure + 5);
    handleExposureChange(newValue);
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
      {/* Tablet: Layout lebih kompak dengan gap dan margin yang lebih kecil */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-7xl mt-16 camera-session-grid">
        {/* LEFT COLUMN - Camera View (2 bagian) */}
        {/* Tablet: Kolom kiri lebih kompak, mengurangi spacing */}
        <div className="col-span-2 flex flex-col items-center">
          {/* Tablet: Video preview dengan aspect ratio 4:3 (landscape) untuk photobooth */}
          <div className="relative w-full camera-session-video" style={{ aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg"
            />
            <CountdownOverlay countdown={countdown} />
            
            {/* Camera Start / Capture Start Overlay */}
            {!isActive && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg z-40 bg-black/50">
                <Button
                  onClick={handleStartCamera}
                  className="px-12 py-6 text-xl font-semibold"
                  size="lg"
                >
                  Start Camera
                </Button>
              </div>
            )}
            {isActive && !hasStarted && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg z-40">
                <Button
                  onClick={handleStart}
                  className="px-12 py-6 text-xl font-semibold"
                  size="lg"
                >
                  Start
                </Button>
              </div>
            )}
          </div>

          {/* Exposure Slider */}
          {/* Tablet: Exposure slider lebih kompak, width disesuaikan */}
          {!isLoading && !error && (
            <div className="w-120 mt-4 px-4 camera-session-exposure">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExposureDecrease}
                  disabled={exposure <= 0}
                  className="h-10 w-10 rounded-full border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Exposure</span>
                    <span className="text-sm font-medium text-white">{exposure}</span>
                  </div>
                  <div 
                    className="relative w-full"
                    onMouseDown={(e) => {
                      // Handle click on track
                      if (e.target === e.currentTarget || e.target.classList.contains('bg-white/20')) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        const newValue = Math.round(percentage);
                        handleExposureChange(newValue);
                      }
                    }}
                  >
                    <div className="relative h-3 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer">
                      <div
                        className="absolute h-full bg-white rounded-full transition-all duration-150"
                        style={{ width: `${exposure}%` }}
                      />
                      <div
                        className="absolute h-6 w-6 -top-1.5 rounded-full bg-white border-2 border-white shadow-lg cursor-grab active:cursor-grabbing transition-all hover:scale-110 z-10"
                        style={{
                          left: `calc(${exposure}% - 12px)`,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const slider = e.currentTarget.parentElement;
                          const rect = slider.getBoundingClientRect();
                          
                          const handleMove = (moveEvent) => {
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            const newValue = Math.round(percentage);
                            handleExposureChange(newValue);
                          };
                          
                          const handleUp = () => {
                            document.removeEventListener("mousemove", handleMove);
                            document.removeEventListener("mouseup", handleUp);
                          };
                          
                          handleMove(e);
                          document.addEventListener("mousemove", handleMove);
                          document.addEventListener("mouseup", handleUp);
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExposureIncrease}
                  disabled={exposure >= 100}
                  className="h-10 w-10 rounded-full border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* RIGHT COLUMN - Photos Preview (1 bagian) */}
        {/* Tablet: Kolom kanan lebih kompak, spacing dikurangi */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-white camera-session-photos-title">Photos</h2>
          <div className="text-sm text-white/70 camera-session-photos-count">
            {photos.length}/1 photos captured
          </div>

          {photos.length === 0 ? (
            <div className="text-center text-white/50 text-sm rounded-lg py-6 bg-black/10">
              No Photos Yet
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {photos.map((photo, i) => (
                <div
                  key={`photo-${i}-${photo.substring(0, 20)}`}
                  className="relative group w-full flex items-center justify-center"
                >
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="rounded-lg max-w-full h-auto object-contain"
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


      {/* Next Button - Show when 3 photos are captured */}
      {/* Tablet: Tombol tetap terlihat, posisi disesuaikan agar tidak keluar layar */}
      {photos.length === 1 && (
        <Button
          onClick={handleNext}
          className="absolute bottom-6 right-6 z-10 camera-session-next-btn"
          size="lg"
        >
          Selanjutnya
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-destructive text-white p-6 rounded-lg max-w-md mx-4">
            <pre className="mb-4 whitespace-pre-wrap text-sm font-sans">{error}</pre>
            <div className="flex gap-3">
              <Button onClick={retryCamera} className="flex-1">
                Coba Lagi
              </Button>
              <Button onClick={startCamera} variant="outline" className="flex-1">
                Retry Normal
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
