/**
 * Camera utilities - Android-first design for photobooth applications
 * 
 * KEY PRINCIPLES:
 * - Android Chrome: Use facingMode, avoid deviceId constraints
 * - Desktop: Optional deviceId selection
 * - IP Camera: Completely separate from MediaDevices API
 * - Simplicity: Minimal logic, maximum reliability
 */

// IP Camera configuration (separate from MediaDevices)
export const IP_CAMERA_ID = "ip-camera-localhost-1024";
export const IP_CAMERA_URL = "http://localhost:1024";

/**
 * Detect if running on Android
 * Android Chrome has different behavior for camera constraints
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if deviceId is an IP camera (not a MediaDevice)
 */
export function isIPCamera(deviceId: string | null): boolean {
  return deviceId === IP_CAMERA_ID;
}

/**
 * Start camera stream with Android-first strategy
 * 
 * WHY facingMode on Android:
 * - deviceId: { exact } causes OverconstrainedError on many Android devices
 * - Android Chrome auto-selects the best available camera with facingMode
 * - More reliable than deviceId enumeration on low-end devices
 * 
 * @param deviceId - Optional deviceId (DESKTOP ONLY, ignored on Android)
 * @returns MediaStream or null (null indicates IP camera should be used)
 */
export async function startCameraStream(deviceId?: string | null): Promise<MediaStream | null> {
  // Check if IP camera is selected
  const savedDeviceId = deviceId || localStorage.getItem("photobooth_selectedCameraId");
  if (isIPCamera(savedDeviceId)) {
    console.log("[Camera] IP Camera selected, returning null");
    return null; // IP camera uses <video src>, not getUserMedia
  }

  // Validate MediaDevices API
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API not supported. Use Chrome, Firefox, Safari, or Edge.");
  }

  const isAndroidDevice = isAndroid();

  // ANDROID STRATEGY: Use facingMode (let browser auto-select)
  if (isAndroidDevice) {
    console.log("[Camera] Android detected - using facingMode: environment");
    
    try {
      // Use environment (back camera) with 4:3 aspect ratio for photobooth
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          aspectRatio: 4 / 3
        },
        audio: false
      });
      console.log("[Camera] ✅ Android camera started with facingMode");
      return stream;
    } catch (error: any) {
      // Fallback: try user (front camera) if environment fails
      console.warn("[Camera] environment facingMode failed, trying user:", error.name);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            aspectRatio: 4 / 3
          },
          audio: false
        });
        console.log("[Camera] ✅ Android camera started with facingMode: user");
        return stream;
      } catch (fallbackError: any) {
        // Last resort: minimal constraints
        console.warn("[Camera] facingMode failed, trying minimal constraints");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        console.log("[Camera] ✅ Android camera started with minimal constraints");
        return stream;
      }
    }
  }

  // DESKTOP STRATEGY: Use deviceId if provided, otherwise let browser choose
  if (deviceId && deviceId !== IP_CAMERA_ID) {
    console.log("[Camera] Desktop - using deviceId:", deviceId.substring(0, 20) + "...");
    try {
      // Desktop can handle deviceId constraints reliably
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { ideal: deviceId }, // Use ideal, not exact (more forgiving)
          aspectRatio: 4 / 3
        },
        audio: false
      });
      console.log("[Camera] ✅ Desktop camera started with deviceId");
      return stream;
    } catch (error: any) {
      console.warn("[Camera] deviceId failed, falling back to default:", error.name);
      // Fall through to default
    }
  }

  // DEFAULT: Let browser choose (works on both Android and Desktop)
  console.log("[Camera] Using default camera selection");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      aspectRatio: 4 / 3
    },
    audio: false
  });
  console.log("[Camera] ✅ Camera started with default selection");
  return stream;
}

/**
 * Stop camera stream and cleanup
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log("[Camera] Track stopped");
    });
  }
}

/**
 * Capture photo from video element
 * Used for both MediaStream and IP camera video elements
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
 * Enumerate cameras (DESKTOP ONLY - for camera selection UI)
 * On Android, this is unreliable and not recommended
 */
export async function enumerateCameras(): Promise<MediaDeviceInfo[]> {
  // Don't enumerate on Android - it's unreliable and not needed
  if (isAndroid()) {
    console.log("[Camera] Skipping enumeration on Android");
    return [];
  }

  try {
    // Request permission first (required for labels)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: false 
    });
    stream.getTracks().forEach(track => track.stop());
    
    // Small delay for permission propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Enumerate once (no retries needed on desktop)
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => 
      device.kind === "videoinput" && device.deviceId && device.deviceId !== ""
    );
    
    console.log(`[Camera] Found ${cameras.length} camera(s) on desktop`);
    return cameras;
  } catch (error: any) {
    console.error("[Camera] Enumeration failed:", error);
    return [];
  }
}
