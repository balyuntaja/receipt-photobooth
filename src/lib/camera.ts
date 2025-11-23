// Camera utility functions

export async function requestCameraAccess(): Promise<MediaStream | null> {
  try {
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
    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
    
    if (validDeviceId) {
      videoConstraints.deviceId = { exact: validDeviceId };
    } else {
      videoConstraints.facingMode = "user"; // Front camera fallback
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error("Error accessing camera:", error);
    
    // If OverconstrainedError with saved deviceId, try fallback to facingMode
    if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
      const savedDeviceId = localStorage.getItem("photobooth_selectedCameraId");
      if (savedDeviceId) {
        console.warn("Saved camera device failed, trying fallback to facingMode");
        // Remove invalid deviceId and try again with facingMode
        localStorage.removeItem("photobooth_selectedCameraId");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });
          return stream;
        } catch (fallbackError) {
          console.error("Fallback camera also failed:", fallbackError);
        }
      }
    }
    
    return null;
  }
}

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

export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

