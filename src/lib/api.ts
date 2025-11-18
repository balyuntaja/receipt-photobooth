/**
 * API Configuration and Functions
 * Handles upload and view operations with backend
 */

import appConfig from "../../config.json";

const API_BASE_URL = appConfig.apiBaseUrl || "http://localhost:3000";
const API_KEY = appConfig.apiKey || "ac89cefb7d385811283fa978c241b8c4ec3a0def07d8807318e1fcaab1fbef33";

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  // Generate a random alphanumeric string with timestamp
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`.substring(0, 50); // Max 50 chars as per API validation
}

/**
 * Upload multiple files to backend
 * @param files - Array of File objects or Blob objects with names
 * @param sessionId - Session ID for grouping files
 * @returns Upload response with file URLs
 */
export async function uploadFiles(
  files: (File | Blob)[],
  sessionId: string
): Promise<{
  success: boolean;
  sessionId: string;
  bucketUrl?: string;
  count?: number;
  files?: Array<{
    filename: string;
    uploadedName: string;
    url: string;
    photoIndex: string;
  }>;
  message?: string;
}> {
  try {
    // Validate sessionId
    if (!sessionId || sessionId.length > 100) {
      throw new Error("Invalid sessionId");
    }

    // Create FormData
    const formData = new FormData();

    // Add files to FormData with proper naming convention
    files.forEach((file, index) => {
      // Determine field name based on file type or index
      // Photos/Videos: photo-1, photo-2, etc.
      // GIF: gif
      let fieldName: string;
      
      // Check if file is a GIF (by name or type)
      const fileName = file instanceof File ? file.name : `photo-${index + 1}`;
      const fileType = file instanceof File ? file.type : "";
      const isGif = fileName.toLowerCase().includes("gif") || 
                   fileType === "image/gif";
      
      if (isGif) {
        fieldName = "gif";
        console.log(`[API] Detected GIF file: ${fileName}, type: ${fileType}, field name: ${fieldName}`);
      } else {
        // Use photo-{index+1} format (1-based index)
        // First file is usually the merged photostrip, rest are original photos
        fieldName = `photo-${index + 1}`;
        console.log(`[API] Photo file: ${fileName}, type: ${fileType}, field name: ${fieldName}`);
      }

      // Append file with proper field name
      formData.append(fieldName, file);
    });

    // Add sessionId to query parameter
    const url = new URL(`${API_BASE_URL}/upload`);
    url.searchParams.append("sessionId", sessionId);

    // Make request with API key in header
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      sessionId,
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get all files for a specific sessionId
 * @param sessionId - Session ID to fetch files for
 * @returns View response with file information
 */
export async function viewFiles(sessionId: string): Promise<{
  success: boolean;
  sessionId: string;
  bucketUrl?: string;
  count?: number;
  files?: Array<{
    name: string;
    url: string;
    photoIndex: string;
    contentType?: string;
    size?: string;
    timeCreated?: string;
    updated?: string;
  }>;
  message?: string;
}> {
  try {
    // Validate sessionId
    if (!sessionId || sessionId.length > 100) {
      throw new Error("Invalid sessionId");
    }

    const url = new URL(`${API_BASE_URL}/view`);
    url.searchParams.append("sessionId", sessionId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `View failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("View error:", error);
    return {
      success: false,
      sessionId,
      files: [],
      message: error instanceof Error ? error.message : "Failed to fetch files",
    };
  }
}

/**
 * Convert data URL to File/Blob for upload
 * @param dataUrl - Data URL string
 * @param filename - Optional filename
 * @returns File object
 */
export function dataURLtoFile(dataUrl: string, filename?: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  const blob = new Blob([u8arr], { type: mime });
  const file = new File([blob], filename || `photo-${Date.now()}.png`, { type: mime });
  return file;
}

/**
 * Upload photos from data URLs
 * @param photoDataUrls - Array of data URL strings
 * @param sessionId - Session ID
 * @returns Upload response
 */
export async function uploadPhotosFromDataUrls(
  photoDataUrls: string[],
  sessionId: string
): Promise<ReturnType<typeof uploadFiles>> {
  // Convert data URLs to Files
  const files = photoDataUrls.map((dataUrl, index) => {
    const isGif = dataUrl.includes("data:image/gif");
    const filename = isGif 
      ? `photo-gif-${Date.now()}.gif`
      : `photo-${index + 1}-${Date.now()}.png`;
    return dataURLtoFile(dataUrl, filename);
  });

  return uploadFiles(files, sessionId);
}

