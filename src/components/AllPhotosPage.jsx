import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, RefreshCw, X, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "./common/PageLayout";
import { getAllPhotos } from "@/lib/api";

export default function AllPhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Fetch all photos when component mounts
  useEffect(() => {
    loadAllPhotos();
  }, []);

  const loadAllPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllPhotos();
      
      if (result && result.success && result.photos && result.photos.length > 0) {
        // Sort photos by timeCreated (newest first) or by sessionId
        const sortedPhotos = [...result.photos].sort((a, b) => {
          if (a.timeCreated && b.timeCreated) {
            return new Date(b.timeCreated) - new Date(a.timeCreated);
          }
          return b.sessionId.localeCompare(a.sessionId);
        });

        setPhotos(sortedPhotos);
        console.log("All photos loaded:", sortedPhotos.length);
      } else {
        setPhotos([]);
        if (result && result.message) {
          setError(result.message);
        }
      }
    } catch (err) {
      console.error("Error loading all photos:", err);
      setError(err.message || "Failed to load photos");
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    for (const photo of photos) {
      await downloadImage(photo.url);
      // Small delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const activePhoto =
    activePhotoIndex !== null && activePhotoIndex >= 0 && activePhotoIndex < photos.length
      ? photos[activePhotoIndex]
      : null;

  const handleRefresh = async () => {
    await loadAllPhotos();
  };

  // Group photos by sessionId
  const photosBySession = photos.reduce((acc, photo) => {
    if (!acc[photo.sessionId]) {
      acc[photo.sessionId] = [];
    }
    acc[photo.sessionId].push(photo);
    return acc;
  }, {});

  const sessionCount = Object.keys(photosBySession).length;

  return (
    <PageLayout className="flex flex-col items-center py-4 sm:py-6" showLockButton={false}>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 text-center w-full">
        {/* Header with Home button */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="px-4 py-2 text-sm"
            size="lg"
          >
            <Home className="mr-2 h-4 w-4" />
            HOME
          </Button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-white flex-1">
            All Photos
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <p className="text-xs sm:text-sm mt-3 max-w-xl mx-auto text-white/80 px-2">
          Total: {photos.length} photos from {sessionCount} session{sessionCount !== 1 ? 's' : ''}
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
            disabled={isLoading}
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
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-xs sm:text-sm mx-2">
            {error}
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
        {!isLoading && photos.length === 0 && !error && (
          <div className="mt-6 sm:mt-10 p-4 sm:p-6 bg-white/10 rounded-lg text-white mx-2">
            <p className="text-base sm:text-lg mb-2">No photos found</p>
            <p className="text-xs sm:text-sm text-white/70">
              There are no photos available at the moment.
            </p>
          </div>
        )}

        {/* Photos Grid - Grouped by Session */}
        {photos.length > 0 && (
          <div className="mt-6 sm:mt-10 w-full">
            {Object.entries(photosBySession).map(([sessionId, sessionPhotos]) => (
              <div key={sessionId} className="mb-8">
                <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-medium text-white px-2 text-left">
                  Session: {sessionId} ({sessionPhotos.length} photos)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-0">
                  {sessionPhotos.map((photo, index) => {
                    const isGif = photo.url.toLowerCase().includes('.gif') || 
                                 photo.photoIndex === 'gif' ||
                                 photo.contentType === 'image/gif';
                    const label = isGif
                      ? 'GIF'
                      : `Photo ${photo.photoIndex || index + 1}`;

                    return (
                      <div
                        key={`${photo.sessionId}-${photo.url}-${index}`}
                        className="relative w-full aspect-square cursor-pointer group overflow-hidden rounded-lg drop-shadow-xl bg-white/10 border border-white/10"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const globalIndex = photos.findIndex(p => 
                            p.sessionId === photo.sessionId && p.url === photo.url
                          );
                          setActivePhotoIndex(globalIndex);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            const globalIndex = photos.findIndex(p => 
                              p.sessionId === photo.sessionId && p.url === photo.url
                            );
                            setActivePhotoIndex(globalIndex);
                          }
                        }}
                      >
                        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
                        <img
                          src={photo.url}
                          alt={label}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                          loading="lazy"
                        />

                        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full screen photo preview */}
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
                  downloadImage(activePhoto.url);
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
            <div className="absolute left-4 top-4 sm:left-6 sm:top-6 text-white text-xs sm:text-sm">
              <p className="bg-black/60 px-3 py-2 rounded-lg">
                Session: {activePhoto.sessionId}
              </p>
            </div>
            <div
              className="relative w-full max-w-4xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={activePhoto.url}
                alt="Preview detail"
                className="w-full max-h-[85vh] sm:max-h-[80vh] rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

