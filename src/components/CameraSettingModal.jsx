import { useEffect, useState, useRef } from "react";
import { connectPrinter, isPrinterConnected as checkPrinterConnected } from "@/lib/printer";
import { Button } from "@/components/ui/Button";
import { enumerateCameras, isAndroid, isIPCamera, IP_CAMERA_ID, IP_CAMERA_URL } from "@/lib/camera";

// IP Camera constants imported from camera.ts

export default function CameraSettingModal({ open, onClose }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Detect available cameras (DESKTOP ONLY - Android enumeration is unreliable)
  useEffect(() => {
    if (!open) return;

    const loadCameras = async () => {
      // On Android, skip enumeration - camera selection uses facingMode
      if (isAndroid()) {
        console.log("[CameraSettingModal] Android detected - skipping enumeration");
        setDevices([]);
        const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
        // On Android, default to "android-default" (uses facingMode) unless IP camera is selected
        setSelectedDeviceId(savedDeviceId === IP_CAMERA_ID ? IP_CAMERA_ID : "android-default");
        return;
      }

      // Desktop: enumerate cameras for selection
      try {
        const cameras = await enumerateCameras();
        setDevices(cameras);
        
        // Load saved camera preference
        const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
        if (savedDeviceId === IP_CAMERA_ID) {
          setSelectedDeviceId(IP_CAMERA_ID);
        } else if (savedDeviceId && cameras.find(cam => cam.deviceId === savedDeviceId)) {
          setSelectedDeviceId(savedDeviceId);
        } else if (cameras.length > 0) {
          setSelectedDeviceId(cameras[0].deviceId);
        } else {
          setSelectedDeviceId(IP_CAMERA_ID);
        }
      } catch (error) {
        console.error("[CameraSettingModal] Error loading cameras:", error);
        setDevices([]);
        setSelectedDeviceId(IP_CAMERA_ID);
      }
    };

    loadCameras();
  }, [open]);

  // Start camera preview when device changes
  useEffect(() => {
    if (!selectedDeviceId || !open) return;

    // Stop stream sebelumnya jika ada
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Clear video srcObject
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Check if IP camera is selected
    if (isIPCamera(selectedDeviceId)) {
      // IP camera: use <video src> (NOT getUserMedia)
      if (videoRef.current) {
        videoRef.current.src = IP_CAMERA_URL;
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
    } else {
      // Regular camera: use getUserMedia
      // On Android, use facingMode (ignore deviceId); on Desktop, use deviceId if available
      const constraints = isAndroid() || selectedDeviceId === "android-default"
        ? {
            video: {
              facingMode: "environment",
              aspectRatio: 4 / 3
            },
            audio: false
          }
        : {
            video: {
              deviceId: selectedDeviceId ? { ideal: selectedDeviceId } : true,
              aspectRatio: 4 / 3
            },
            audio: false
          };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.src = "";
            videoRef.current.play().catch(err => {
              console.warn("[CameraSettingModal] Video play() failed:", err);
            });
          }
        })
        .catch((err) => {
          console.error("[CameraSettingModal] Camera preview failed:", err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedDeviceId, open]);

  // Check printer connection status
  useEffect(() => {
    if (open) {
      setIsPrinterConnected(checkPrinterConnected());
    }
  }, [open]);

  // Cleanup on close
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [open]);

  const handleConnectPrinter = async () => {
    try {
      await connectPrinter();
      setIsPrinterConnected(true);
      alert("Printer terhubung!");
    } catch (error) {
      console.error("Error connecting printer:", error);
      alert("Gagal menghubungkan printer. Pastikan printer terhubung dan browser mendukung WebUSB.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Camera Settings</h2>
        {/* Dropdown select camera */}
        <label className="block mb-2 font-medium">Pilih Kamera:</label>
        <select
          value={selectedDeviceId}
          onChange={(e) => {
            const newDeviceId = e.target.value;
            setSelectedDeviceId(newDeviceId);
            // Save to localStorage (except Android default which uses facingMode)
            if (newDeviceId !== "android-default") {
              localStorage.setItem("photobooth_selectedCameraId", newDeviceId);
            } else {
              localStorage.removeItem("photobooth_selectedCameraId");
            }
          }}
          className="border w-full p-2 rounded mb-4"
        >
          {/* IP Camera option */}
          <option value={IP_CAMERA_ID}>IP Camera (localhost:1024)</option>
          {/* Regular cameras (Desktop only - Android uses facingMode) */}
          {isAndroid() ? (
            <option value="android-default">Android Camera (Auto - facingMode)</option>
          ) : (
            devices.map((cam, i) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${i + 1}`}
              </option>
            ))
          )}
        </select>
        {/* Video Preview dengan aspect ratio 4:3 (landscape) */}
        <div className="relative w-full mb-4" style={{ aspectRatio: "4/3" }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover rounded" 
          />
        </div>
        
        {/* Printer Connection Section */}
        <div className="border-t pt-4 mt-4">
          <label className="block mb-2 font-medium">Printer:</label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">
              Status: {isPrinterConnected ? (
                <span className="text-green-600 font-semibold">Terhubung</span>
              ) : (
                <span className="text-red-600 font-semibold">Tidak Terhubung</span>
              )}
            </span>
          </div>
          {!isPrinterConnected && (
            <button
              onClick={handleConnectPrinter}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-4 hover:bg-blue-700 transition-colors"
            >
              Hubungkan Printer
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="bg-red-600 text-white px-4 py-2 rounded w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}

