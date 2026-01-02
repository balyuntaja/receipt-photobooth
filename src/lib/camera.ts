// Camera utility functions - Optimized for Android low-end devices (Itel VistaTab 11)

// IP Camera identifier and URL
export const IP_CAMERA_ID = "ip-camera-localhost-8080";
export const IP_CAMERA_URL = "http://localhost:8080";

/**
 * Check if deviceId is an IP camera
 */
export function isIPCamera(deviceId: string | null): boolean {
  return deviceId === IP_CAMERA_ID;
}

/**
 * Request camera permission first (required for enumerateDevices to work properly on Android)
 */
async function requestCameraPermission(): Promise<boolean> {
  try {
    // Request permission with minimal constraints first
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: false 
    });
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    console.log("Camera permission granted");
    return true;
  } catch (error: any) {
    console.error("Camera permission denied:", error.name, error.message);
    return false;
  }
}

/**
 * Enumerate all available camera devices with proper permission handling
 * This function ensures permission is granted before enumerating (required for Android)
 */
export async function enumerateCameras(): Promise<MediaDeviceInfo[]> {
  try {
    // Step 1: Request permission first (required for Android to return deviceId)
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.warn("No camera permission, cannot enumerate devices");
      return [];
    }

    // Step 2: Wait a bit for permission to propagate (Android quirk)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: Enumerate devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");
    
    console.log(`Found ${cameras.length} camera(s):`, 
      cameras.map(cam => ({
        deviceId: cam.deviceId.substring(0, 20) + "...",
        label: cam.label || "Unnamed camera",
        hasLabel: !!cam.label
      }))
    );

    // Check if we have deviceId (not just empty strings)
    const validCameras = cameras.filter(cam => cam.deviceId && cam.deviceId !== "");
    
    if (validCameras.length === 0) {
      console.warn("No valid camera deviceId found - may need to open camera app first");
    }

    return validCameras;
  } catch (error: any) {
    console.error("Error enumerating cameras:", error.name, error.message);
    return [];
  }
}

/**
 * Detect USB webcam by checking label for USB/UVC/NYK keywords
 * Priority: saved deviceId > USB webcam > front camera > any camera
 */
function detectUSBWebcam(cameras: MediaDeviceInfo[]): MediaDeviceInfo | null {
  for (const cam of cameras) {
    const label = (cam.label || "").toLowerCase();
    // Check for USB webcam indicators (case-insensitive)
    if (label.includes("uvc") || label.includes("usb") || label.includes("nyk")) {
      console.log("USB webcam detected:", cam.label);
      return cam;
    }
  }
  return null;
}

/**
 * Find the best available camera device
 * Priority: saved deviceId > USB webcam > front camera > any camera
 */
async function findBestCamera(savedDeviceId: string | null): Promise<MediaDeviceInfo | null> {
  const cameras = await enumerateCameras();
  
  if (cameras.length === 0) {
    console.warn("No cameras found");
    return null;
  }

  // Try saved deviceId first
  if (savedDeviceId && !isIPCamera(savedDeviceId)) {
    const savedCamera = cameras.find(cam => cam.deviceId === savedDeviceId);
    if (savedCamera) {
      console.log("Using saved camera deviceId");
      return savedCamera;
    } else {
      console.warn("Saved camera deviceId no longer available, removing from storage");
      localStorage.removeItem("photobooth_selectedCameraId");
    }
  }

  // Priority 2: Detect USB webcam (NYK NEMESIS or other UVC cameras)
  const usbWebcam = detectUSBWebcam(cameras);
  if (usbWebcam) {
    console.log("Using USB webcam:", usbWebcam.label);
    return usbWebcam;
  }

  // Priority 3: Try to find front camera (usually labeled as "front" or "user")
  const frontCamera = cameras.find(cam => 
    cam.label.toLowerCase().includes("front") || 
    cam.label.toLowerCase().includes("user") ||
    cam.label.toLowerCase().includes("facing")
  );

  if (frontCamera) {
    console.log("Using front camera");
    return frontCamera;
  }

  // Fallback to first available camera
  console.log("Using first available camera");
  return cameras[0];
}

/**
 * Try to get camera stream with specific constraints
 */
async function tryGetCameraStream(constraints: MediaTrackConstraints): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: constraints,
      audio: false,
    });
    return stream;
  } catch (error: any) {
    console.warn(`Failed with constraints:`, constraints, error.name, error.message);
    return null;
  }
}

/**
 * Request camera access with comprehensive fallback strategy
 * Optimized for Android low-end devices like Itel VistaTab 11
 */
export async function requestCameraAccess(): Promise<MediaStream | null> {
  console.log("Starting camera access request...");

  const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");

  // Check if IP camera is selected
  if (isIPCamera(savedDeviceId)) {
    console.log("IP Camera selected, returning null (will use video src)");
    // Return null to indicate IP camera (will be handled by video element src)
    return null;
  }

  // Check if MediaDevices API is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const errorMsg = "Browser tidak mendukung akses kamera. Gunakan browser modern (Chrome, Firefox, Safari, Edge).";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Strategy 1: Try with saved deviceId if available
  if (savedDeviceId && !isIPCamera(savedDeviceId)) {
    console.log("Attempting to use saved camera deviceId...");
    const cameras = await enumerateCameras();
    const savedCamera = cameras.find(cam => cam.deviceId === savedDeviceId);
    
    if (savedCamera) {
      // Use exact deviceId constraint to ensure correct device selection on Android
      const stream = await tryGetCameraStream({
        deviceId: { exact: savedDeviceId },
      });
      
      if (stream) {
        console.log("Successfully opened camera with saved deviceId");
        return stream;
      } else {
        console.warn("Saved deviceId failed, removing from storage");
        localStorage.removeItem("photobooth_selectedCameraId");
      }
    } else {
      console.warn("Saved deviceId not found in available cameras");
      localStorage.removeItem("photobooth_selectedCameraId");
    }
  }

  // Strategy 2: Find best camera (USB webcam detection happens here)
  console.log("Finding best available camera...");
  const bestCamera = await findBestCamera(savedDeviceId);
  
  if (bestCamera && bestCamera.deviceId) {
    console.log("Attempting to use camera with deviceId:", bestCamera.deviceId.substring(0, 20) + "...", "Label:", bestCamera.label);
    
    // Always use exact deviceId constraint for USB webcam and saved cameras
    // This ensures Android Chrome selects the correct device instead of defaulting to built-in camera
    const stream = await tryGetCameraStream({
      deviceId: { exact: bestCamera.deviceId },
    });
    
    if (stream) {
      console.log("Successfully opened camera with exact deviceId");
      // Save successful deviceId
      localStorage.setItem("photobooth_selectedCameraId", bestCamera.deviceId);
      return stream;
    }

    // Fallback: Try with ideal deviceId (less strict) if exact fails
    const fallbackStream = await tryGetCameraStream({
      deviceId: { ideal: bestCamera.deviceId },
    });
    
    if (fallbackStream) {
      console.log("Successfully opened camera with ideal deviceId");
      localStorage.setItem("photobooth_selectedCameraId", bestCamera.deviceId);
      return fallbackStream;
    }

    console.warn("Failed to open camera with deviceId, will try other strategies");
  }

  // Strategy 3: Try with facingMode (if supported)
  console.log("Attempting to use facingMode fallback...");
  let stream = await tryGetCameraStream({
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  });
  
  if (stream) {
    console.log("Successfully opened camera with facingMode: user");
    return stream;
  }

  // Try facingMode without resolution constraints
  stream = await tryGetCameraStream({
    facingMode: "user",
  });
  
  if (stream) {
    console.log("Successfully opened camera with facingMode (no resolution)");
    return stream;
  }

  // Strategy 4: Try with any available camera (minimal constraints)
  console.log("Attempting with minimal constraints...");
  stream = await tryGetCameraStream({
    width: { ideal: 1280 },
    height: { ideal: 720 },
  });
  
  if (stream) {
    console.log("Successfully opened camera with resolution constraints");
    return stream;
  }

  // Strategy 5: Last resort - try with just video: true
  console.log("Attempting with video: true (last resort)...");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    if (stream) {
      console.log("Successfully opened camera with video: true");
      return stream;
    }
  } catch (lastResortError: any) {
    console.warn("Last resort also failed:", lastResortError.name, lastResortError.message);
  }
  
  if (stream) {
    console.log("Successfully opened camera with minimal constraints");
    return stream;
  }

  // All strategies failed
  const errorMsg = "Tidak dapat mengakses kamera setelah mencoba semua strategi. Pastikan:\n" +
    "- Kamera terhubung dan berfungsi\n" +
    "- Permission kamera sudah diberikan\n" +
    "- Kamera tidak digunakan aplikasi lain\n" +
    "- Coba buka aplikasi kamera dulu, lalu kembali ke browser";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

/**
 * Reinitialize camera - useful for retry mechanism
 */
export async function reinitializeCamera(): Promise<MediaStream | null> {
  console.log("Reinitializing camera...");
  
  // Clear saved deviceId to force re-detection
  localStorage.removeItem("photobooth_selectedCameraId");
  
  // Wait a bit before retrying
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return await requestCameraAccess();
}

/**
 * Capture photo from video element
 */
export function capturePhotoFromVideo(
  video: HTMLVideoElement,
  width?: number,
  height?: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width || video.videoWidth;
  canvas.height = height || video.videoHeight;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Stop camera stream and cleanup
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log("Camera track stopped");
    });
  }
}
