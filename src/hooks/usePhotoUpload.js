import { useState, useCallback } from "react";
import { uploadFiles, uploadPhotosFromDataUrls, viewFiles, generateSessionId } from "@/lib/api";

/**
 * Custom hook for uploading photos to backend
 */
export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [sessionId, setSessionId] = useState(() => {
    // Generate sessionId on mount or get from storage
    const stored = sessionStorage.getItem("photobooth_sessionId");
    if (stored) {
      return stored;
    }
    const newSessionId = generateSessionId();
    sessionStorage.setItem("photobooth_sessionId", newSessionId);
    return newSessionId;
  });

  /**
   * Upload photos from data URLs
   */
  const uploadPhotos = useCallback(async (photoDataUrls) => {
    if (!photoDataUrls || photoDataUrls.length === 0) {
      setUploadError("No photos to upload");
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadPhotosFromDataUrls(photoDataUrls, sessionId);
      
      if (result.success) {
        setUploadResult(result);
        return result;
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  /**
   * Upload files directly
   */
  const uploadFilesDirect = useCallback(async (files) => {
    if (!files || files.length === 0) {
      setUploadError("No files to upload");
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFiles(files, sessionId);
      
      if (result.success) {
        setUploadResult(result);
        return result;
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  /**
   * Fetch files for current session
   */
  const fetchFiles = useCallback(async () => {
    if (!sessionId) {
      setUploadError("No session ID");
      return null;
    }

    try {
      const result = await viewFiles(sessionId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch files";
      setUploadError(errorMessage);
      console.error("Fetch error:", error);
      return null;
    }
  }, [sessionId]);

  /**
   * Reset session and generate new sessionId
   */
  const resetSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    sessionStorage.setItem("photobooth_sessionId", newSessionId);
    setUploadResult(null);
    setUploadError(null);
  }, []);

  /**
   * Set sessionId manually (e.g., from URL parameter)
   */
  const setSessionIdManual = useCallback((newSessionId) => {
    if (newSessionId && newSessionId.length <= 100) {
      setSessionId(newSessionId);
      sessionStorage.setItem("photobooth_sessionId", newSessionId);
    }
  }, []);

  return {
    sessionId,
    isUploading,
    uploadError,
    uploadResult,
    uploadPhotos,
    uploadFilesDirect,
    fetchFiles,
    resetSession,
    setSessionId: setSessionIdManual,
  };
}

