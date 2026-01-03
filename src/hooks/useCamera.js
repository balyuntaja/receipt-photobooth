import { useRef, useState, useCallback } from "react";
import { 
  startCameraStream, 
  stopCameraStream, 
  isIPCamera, 
  IP_CAMERA_URL,
  isAndroid 
} from "@/lib/camera";

/**
 * Camera hook - Android-first design
 * 
 * IMPORTANT: Camera must be started via user gesture (button click)
 * Auto-start on mount is disabled for Android compatibility
 * 
 * @param {string} deviceId - Optional deviceId (DESKTOP ONLY, ignored on Android)
 * @returns {Object} Camera state and controls
 */
export function useCamera(deviceId = null) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  /**
   * Start camera - MUST be called from user gesture (button click)
   * 
   * On Android:
   * - Uses facingMode (browser auto-selects camera)
   * - Avoids deviceId constraints (causes OverconstrainedError)
   * 
   * On Desktop:
   * - Can use deviceId if provided
   * - Falls back to browser default
   */
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const savedDeviceId = deviceId || localStorage.getItem("photobooth_selectedCameraId");

      // IP Camera handling (completely separate from MediaDevices)
      if (isIPCamera(savedDeviceId)) {
        console.log("[useCamera] Starting IP Camera:", IP_CAMERA_URL);
        if (!videoRef.current) {
          throw new Error("Video element not available");
        }

        videoRef.current.src = IP_CAMERA_URL;
        videoRef.current.srcObject = null;
        videoRef.current.load();

        // Wait for IP camera to load
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not available"));
            return;
          }

          const handleLoadedData = () => {
            cleanup();
            resolve();
          };

          const handleError = (e) => {
            cleanup();
            reject(new Error(`IP camera failed: ${e.message || "Unknown error"}`));
          };

          const cleanup = () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener("loadeddata", handleLoadedData);
              videoRef.current.removeEventListener("error", handleError);
            }
          };

          videoRef.current.addEventListener("loadeddata", handleLoadedData);
          videoRef.current.addEventListener("error", handleError);

          // Timeout after 5 seconds
          setTimeout(() => {
            cleanup();
            reject(new Error("IP camera connection timeout"));
          }, 5000);
        });

        console.log("[useCamera] ✅ IP Camera started");
        setIsActive(true);
        setIsLoading(false);
        return;
      }

      // Regular camera (MediaDevices API)
      console.log("[useCamera] Starting camera stream...");
      const stream = await startCameraStream(savedDeviceId);

      if (!stream) {
        throw new Error("Failed to get camera stream");
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = ""; // Clear src when using srcObject
        
        // Explicitly call play() for Android Chrome compatibility
        await videoRef.current.play();
        console.log("[useCamera] ✅ Camera started and playing");
      }

      setIsActive(true);
      setIsLoading(false);
    } catch (err) {
      console.error("[useCamera] Camera error:", err.name, err.message);
      
      // User-friendly error messages
      let errorMessage = "Tidak dapat mengakses kamera.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Akses kamera ditolak.\n\nSilakan berikan izin kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Kamera tidak ditemukan.\n\nPastikan kamera terhubung dan tidak digunakan aplikasi lain.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Kamera sedang digunakan.\n\nTutup aplikasi lain yang menggunakan kamera.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Kamera tidak mendukung mode yang diminta.\n\nMencoba mode lain...";
        // Auto-retry with minimal constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          streamRef.current = stream;
          setIsActive(true);
          setIsLoading(false);
          return;
        } catch (retryErr) {
          errorMessage = "Tidak dapat mengakses kamera dengan mode apapun.";
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsActive(false);
    }
  }, [deviceId]);

  /**
   * Stop camera and cleanup
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
      if (isIPCamera(savedDeviceId)) {
        videoRef.current.src = "";
        videoRef.current.pause();
      } else {
        videoRef.current.srcObject = null;
      }
    }

    setIsActive(false);
    console.log("[useCamera] Camera stopped");
  }, []);

  /**
   * Retry camera (for error recovery)
   */
  const retryCamera = useCallback(async () => {
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay
    await startCamera();
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    error,
    isLoading,
    isActive,
    startCamera, // Must be called from user gesture
    stopCamera,
    retryCamera,
  };
}
