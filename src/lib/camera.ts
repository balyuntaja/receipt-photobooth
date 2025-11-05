// Camera utility functions

export async function requestCameraAccess(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user", // Front camera
      },
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error("Error accessing camera:", error);
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

