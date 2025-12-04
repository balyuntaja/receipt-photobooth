import { useEffect, useRef, useState } from "react";
import { requestCameraAccess, reinitializeCamera, stopCameraStream } from "@/lib/camera";

/**
 * Custom hook for managing camera stream
 * Optimized for Android low-end devices (Itel VistaTab 11)
 */
export function useCamera(cameraFacingMode = "user") {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const startCamera = async (isRetry = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isRetry) {
        console.log(`Retry attempt ${retryCount + 1}...`);
        setRetryCount(prev => prev + 1);
      }

      // Use the improved camera access function
      const stream = await requestCameraAccess();
      
      if (!stream) {
        throw new Error("Failed to get camera stream");
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      console.log("Camera started successfully");
      setIsLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Camera access error:", err.name, err.message);
      
      // Provide detailed error messages
      let errorMessage = "Tidak dapat mengakses kamera.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Akses kamera ditolak.\n\n" +
          "Silakan:\n" +
          "1. Berikan izin kamera di pengaturan browser\n" +
          "2. Refresh halaman\n" +
          "3. Atau klik tombol 'Coba Lagi' di bawah";
        console.error("Permission denied - user needs to grant camera permission");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "Kamera tidak ditemukan.\n\n" +
          "Pastikan:\n" +
          "1. Kamera terhubung dan berfungsi\n" +
          "2. Tidak digunakan aplikasi lain\n" +
          "3. Coba buka aplikasi kamera dulu, lalu kembali ke browser\n" +
          "4. Klik 'Coba Lagi' setelah membuka aplikasi kamera";
        console.error("No camera found - may need to open camera app first");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Kamera sedang digunakan.\n\n" +
          "Kamera sedang digunakan aplikasi lain atau terjadi masalah pada driver kamera.\n\n" +
          "Solusi:\n" +
          "1. Tutup aplikasi lain yang menggunakan kamera\n" +
          "2. Restart browser\n" +
          "3. Klik 'Coba Lagi'";
        console.error("Camera in use or driver error");
      } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        errorMessage = "Kamera tidak mendukung mode yang diminta.\n\n" +
          "Mencoba fallback ke mode lain...\n" +
          "Klik 'Coba Lagi' untuk mencoba lagi.";
        console.error("OverconstrainedError - constraints not satisfied");
      } else if (err.name === "NotSupportedError") {
        errorMessage = "Browser tidak mendukung akses kamera.\n\n" +
          "Gunakan browser modern:\n" +
          "- Chrome (disarankan)\n" +
          "- Firefox\n" +
          "- Safari\n" +
          "- Edge";
        console.error("Browser not supported");
      } else if (err.name === "SecurityError") {
        errorMessage = "Akses kamera diblokir.\n\n" +
          "Pastikan menggunakan:\n" +
          "- HTTPS (untuk production)\n" +
          "- localhost (untuk development)";
        console.error("Security error - need HTTPS or localhost");
      } else {
        errorMessage = "Tidak dapat mengakses kamera.\n\n" +
          "Pastikan:\n" +
          "1. Kamera terhubung dan berfungsi\n" +
          "2. Permission kamera sudah diberikan\n" +
          "3. Kamera tidak digunakan aplikasi lain\n" +
          "4. Menggunakan HTTPS atau localhost\n" +
          "5. Coba buka aplikasi kamera dulu, lalu kembali ke browser\n\n" +
          "Klik 'Coba Lagi' untuk mencoba lagi.";
        console.error("Unknown error:", err);
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const retryCamera = async () => {
    console.log("Retrying camera access...");
    // Use reinitialize function for retry
    try {
      const stream = await reinitializeCamera();
      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        console.log("Camera reinitialized successfully");
        setError(null);
        setIsLoading(false);
        setRetryCount(0);
      } else {
        // If reinitialize returns null, try normal start
        await startCamera(true);
      }
    } catch (err) {
      console.error("Retry failed:", err);
      await startCamera(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
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
    retryCamera,
    retryCount,
  };
}
