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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Kamera tidak dapat diakses:", err);
      
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

