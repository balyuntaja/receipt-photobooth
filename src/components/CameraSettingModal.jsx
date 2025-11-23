import { useEffect, useState, useRef } from "react";
import { connectPrinter, isPrinterConnected as checkPrinterConnected } from "@/lib/printer";
import { Button } from "@/components/ui/Button";

export default function CameraSettingModal({ open, onClose }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Detect available cameras
  useEffect(() => {
    if (!open) return;

    navigator.mediaDevices.enumerateDevices().then((devs) => {
      const cameras = devs.filter((d) => d.kind === "videoinput");
      setDevices(cameras);
      
      // Load saved camera preference
      const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
      if (savedDeviceId && cameras.find(cam => cam.deviceId === savedDeviceId)) {
        setSelectedDeviceId(savedDeviceId);
      } else if (cameras.length > 0) {
        setSelectedDeviceId(cameras[0].deviceId);
      }
    });
  }, [open]);

  // Start camera preview when device changes
  useEffect(() => {
    if (!selectedDeviceId || !open) return;

    // Stop stream sebelumnya jika ada
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
            // Save to localStorage
            localStorage.setItem("photobooth_selectedCameraId", newDeviceId);
          }}
          className="border w-full p-2 rounded mb-4"
        >
          {devices.map((cam, i) => (
            <option key={cam.deviceId} value={cam.deviceId}>
              {cam.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>
        {/* Video Preview */}
        <video ref={videoRef} autoPlay playsInline className="w-full rounded mb-4" />
        
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

