import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for managing camera stream
 */
export function useCamera(cameraFacingMode = "user") {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get saved camera deviceId from localStorage
      const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
      
      // Verify deviceId is still available
      let validDeviceId = null;
      if (savedDeviceId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameraExists = devices.some(
            (device) => device.kind === "videoinput" && device.deviceId === savedDeviceId
          );
          if (cameraExists) {
            validDeviceId = savedDeviceId;
          } else {
            // Device no longer available, remove from localStorage
            localStorage.removeItem("photobooth_selectedCameraId");
            console.warn("Saved camera device no longer available, using default");
          }
        } catch (enumError) {
          console.warn("Could not enumerate devices, using default camera:", enumError);
        }
      }
      
      // Build video constraints
      const videoConstraints = validDeviceId
        ? { deviceId: { exact: validDeviceId } }
        : { facingMode: cameraFacingMode };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Kamera tidak dapat diakses:", err);
      
      // If OverconstrainedError with saved deviceId, try fallback to facingMode
      if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
        if (savedDeviceId) {
          console.warn("Saved camera device failed, trying fallback to facingMode");
          // Remove invalid deviceId and try again with facingMode
          localStorage.removeItem("photobooth_selectedCameraId");
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: cameraFacingMode },
            });
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setIsLoading(false);
            return; // Success with fallback
          } catch (fallbackErr) {
            console.error("Fallback camera also failed:", fallbackErr);
            // Continue to show error message below
          }
        }
      }
      
      // Provide more specific error messages based on error type
      let errorMessage = "Tidak dapat mengakses kamera.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Akses kamera ditolak. Silakan berikan izin kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "Kamera tidak ditemukan. Pastikan kamera terhubung dan tidak digunakan aplikasi lain.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Kamera sedang digunakan aplikasi lain atau terjadi masalah pada driver kamera.";
      } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        errorMessage = "Kamera tidak mendukung mode yang diminta. Coba gunakan kamera lain.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Browser tidak mendukung akses kamera. Gunakan browser modern (Chrome, Firefox, Safari, Edge).";
      } else if (err.name === "SecurityError") {
        errorMessage = "Akses kamera diblokir. Pastikan menggunakan HTTPS atau localhost.";
      } else {
        errorMessage = "Tidak dapat mengakses kamera. Pastikan:\n- Kamera terhubung\n- Permission sudah diberikan\n- Tidak digunakan aplikasi lain\n- Menggunakan HTTPS atau localhost";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacingMode]);

  return {
    videoRef,
    error,
    isLoading,
    startCamera,
    stopCamera,
  };
}

