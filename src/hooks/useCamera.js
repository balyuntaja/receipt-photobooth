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
      
      // Build video constraints
      const videoConstraints = savedDeviceId
        ? { deviceId: { exact: savedDeviceId } }
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
      setError("Tidak dapat mengakses kamera. Pastikan permission kamera sudah diberikan.");
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

