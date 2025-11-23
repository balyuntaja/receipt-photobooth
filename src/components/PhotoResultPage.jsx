import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, RefreshCw, X } from "lucide-react";
import PageLayout from "./common/PageLayout";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

export default function PhotoResultPage() {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get("sessionId");
  
  const {
    sessionId,
    fetchFiles,
    setSessionId,
    uploadError,
  } = usePhotoUpload();

  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bucketUrl, setBucketUrl] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Set sessionId from URL if provided
  useEffect(() => {
    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl, setSessionId]);

  // Fetch files when component mounts or sessionId changes
  useEffect(() => {
    const loadFiles = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await fetchFiles();
        
        if (result && result.success && result.files && result.files.length > 0) {
          // Sort files by photoIndex (1, 2, 3, gif)
          const sortedFiles = [...result.files].sort((a, b) => {
            // Handle numeric indices
            const aNum = parseInt(a.photoIndex);
            const bNum = parseInt(b.photoIndex);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return aNum - bNum;
            }
            // 'gif' comes after numbers
            if (a.photoIndex === "gif") return 1;
            if (b.photoIndex === "gif") return -1;
            return a.photoIndex.localeCompare(b.photoIndex);
          });

          // Separate GIF from photos
          const gifFile = sortedFiles.find((file) => file.photoIndex === "gif");
          const photoFiles = sortedFiles.filter((file) => file.photoIndex !== "gif");
          
          console.log("Files loaded:", {
            total: sortedFiles.length,
            gif: gifFile ? { url: gifFile.url, photoIndex: gifFile.photoIndex } : null,
            photos: photoFiles.map(f => ({ url: f.url, photoIndex: f.photoIndex }))
          });
          
          // Set photos array - first one is the photostrip result, rest are individual photos
          const photoUrls = photoFiles.map((file) => file.url);
          
          // Add GIF as first item if exists
          if (gifFile) {
            setPhotos([gifFile.url, ...photoUrls]);
            console.log("GIF added to photos array:", gifFile.url);
          } else {
            setPhotos(photoUrls);
            console.log("No GIF found, only photos:", photoUrls.length);
          }
          
          setBucketUrl(result.bucketUrl);
        } else {
          // No files found or error
          setPhotos([]);
        }
      } catch (error) {
        console.error("Error loading files:", error);
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [sessionId, fetchFiles]);

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = blob.type || "image/jpeg";
      const extension = contentType.split("/")[1] || "jpg";
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `photomate-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
    } catch (error) {
      console.error("Download error:", error);
      alert("Gagal mengunduh file. Coba lagi atau periksa koneksi Anda.");
    }
  };

  const downloadAll = async () => {
    for (const url of photos) {
      await downloadImage(url);
    }
  };

  const activePhoto =
    activePhotoIndex !== null && activePhotoIndex >= 0 && activePhotoIndex < photos.length
      ? photos[activePhotoIndex]
      : null;

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await fetchFiles();
      if (result && result.success && result.files && result.files.length > 0) {
        const sortedFiles = [...result.files].sort((a, b) => {
          const aNum = parseInt(a.photoIndex);
          const bNum = parseInt(b.photoIndex);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          if (a.photoIndex === "gif") return 1;
          if (b.photoIndex === "gif") return -1;
          return a.photoIndex.localeCompare(b.photoIndex);
        });
        
        // Separate GIF from photos
        const gifFile = sortedFiles.find((file) => file.photoIndex === "gif");
        const photoFiles = sortedFiles.filter((file) => file.photoIndex !== "gif");
        
        const photoUrls = photoFiles.map((file) => file.url);
        
        // Add GIF as first item if exists
        if (gifFile) {
          setPhotos([gifFile.url, ...photoUrls]);
          console.log("GIF added to photos array (refresh):", gifFile.url);
        } else {
          setPhotos(photoUrls);
          console.log("No GIF found on refresh, only photos:", photoUrls.length);
        }
        
        setBucketUrl(result.bucketUrl);
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sharePhoto = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hasil Photostrip",
          text: "Lihat hasil fotoku!",
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      alert("Fitur share tidak didukung di browser ini.");
    }
  };

  return (
    <PageLayout className="flex flex-col items-center py-4 sm:py-6" showLockButton={false}>
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center w-full">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-2 text-white">
          Here comes your <strong>soft files</strong>
        </h1>

        <p className="text-xs sm:text-sm mt-3 max-w-xl mx-auto text-white/80 px-2">
          Terima kasih telah memilih Photomate. Berikut adalah foto-foto yang telah kamu ambil dan edit. Jangan lupa download softfile kamu sebelum masa berlaku habis!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5 px-2">
          <Button
            onClick={downloadAll}
            className="w-full sm:w-auto px-6 py-2 text-sm"
            size="lg"
            disabled={isLoading || photos.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            DOWNLOAD ALL
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="w-full sm:w-auto px-6 py-2 text-sm"
            size="lg"
            disabled={isLoading || !sessionId}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            REFRESH
          </Button>
        </div>

        {/* Error message */}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-xs sm:text-sm mx-2">
            {uploadError}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-6 sm:mt-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white" />
            <span className="ml-3 text-white text-sm sm:text-base">Loading photos...</span>
          </div>
        )}

        {/* No photos message */}
        {!isLoading && photos.length === 0 && (
          <div className="mt-6 sm:mt-10 p-4 sm:p-6 bg-white/10 rounded-lg text-white mx-2">
            <p className="text-base sm:text-lg mb-2">No photos found</p>
            <p className="text-xs sm:text-sm text-white/70">
              {sessionId 
                ? `No files found for session: ${sessionId}`
                : "Please provide a sessionId in the URL (e.g., /photo-result?sessionId=abc123)"}
            </p>
          </div>
        )}

        {/* Preview Grid */}
        {photos.length > 0 && (
          <div className="mt-6 sm:mt-10 w-full">
            <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-medium text-white px-2">Photo & GIF Preview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-0">
              {photos.map((url, index) => {
                const isGif = url.toLowerCase().includes('.gif') || url.includes('data:image/gif') || url.includes('gif');
                const label = isGif
                  ? 'Animated GIF'
                  : index === 0
                    ? 'Photostrip'
                    : `Photo ${index}`;

                return (
                  <div
                    key={`${url}-${index}`}
                    className="relative w-full aspect-square cursor-pointer group overflow-hidden rounded-lg drop-shadow-xl bg-white/10 border border-white/10"
                    role="button"
                    tabIndex={0}
                    onClick={() => setActivePhotoIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActivePhotoIndex(index);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
                    <img
                      src={url}
                      alt={label}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                    />

                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activePhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-2 sm:px-4"
            onClick={() => setActivePhotoIndex(null)}
          >
            <div className="absolute right-2 top-2 sm:right-6 sm:top-6 flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="bg-black/60 text-white border-white/30 hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
                onClick={(event) => {
                  event.stopPropagation();
                  downloadImage(activePhoto);
                }}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-black/60 text-white border-white/30 hover:bg-black/40 h-8 w-8 sm:h-10 sm:w-10"
                onClick={(event) => {
                  event.stopPropagation();
                  setActivePhotoIndex(null);
                }}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div
              className="relative w-full max-w-4xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={activePhoto}
                alt="Preview detail"
                className="w-full max-h-[85vh] sm:max-h-[80vh] rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        )}

        <div className="mt-14">
          
        </div>
      </div>
    </PageLayout>
  );
}

