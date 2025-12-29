import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, RefreshCw, X, Home, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllPhotos } from "@/lib/api";
import background from "@/assets/background.svg";

const PHOTOS_PER_PAGE = 50;

export default function AllPhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch all photos when component mounts
  useEffect(() => {
    loadAllPhotos(0, true);
  }, []);

  const loadAllPhotos = async (currentOffset = 0, reset = false) => {
    if (reset) {
      setIsLoading(true);
      setPhotos([]);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    
    try {
      const result = await getAllPhotos(PHOTOS_PER_PAGE, currentOffset);
      
      if (result && result.success && result.files && result.files.length > 0) {
        // Sort photos by timeCreated (newest first) - chronological order
        const sortedPhotos = [...result.files].sort((a, b) => {
          if (a.timeCreated && b.timeCreated) {
            return new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime();
          }
          // If no timestamp, maintain original order
          return 0;
        });

        if (reset) {
          setPhotos(sortedPhotos);
        } else {
          // Merge and re-sort to maintain chronological order
          setPhotos(prev => {
            const merged = [...prev, ...sortedPhotos];
            return merged.sort((a, b) => {
              if (a.timeCreated && b.timeCreated) {
                return new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime();
              }
              return 0;
            });
          });
        }
        
        setTotal(result.total || result.count || sortedPhotos.length);
        const newOffset = currentOffset + sortedPhotos.length;
        setOffset(newOffset);
        setHasMore(result.total ? newOffset < result.total : sortedPhotos.length === PHOTOS_PER_PAGE);
        
        console.log("Photos loaded:", {
          current: reset ? sortedPhotos.length : photos.length + sortedPhotos.length,
          total: result.total || result.count,
          hasMore: result.total ? newOffset < result.total : sortedPhotos.length === PHOTOS_PER_PAGE
        });
      } else {
        if (reset) {
          setPhotos([]);
        }
        setHasMore(false);
        if (result && (result.message || result.error)) {
          setError(result.message || result.error);
        }
      }
    } catch (err) {
      console.error("Error loading all photos:", err);
      setError(err.message || "Failed to load photos");
      if (reset) {
        setPhotos([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadAllPhotos(offset, false);
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
    await loadAllPhotos(0, true);
  };

  return (
    <div 
      className="flex flex-col items-center py-4 sm:py-6 min-h-screen w-full overflow-y-auto relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
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
          Showing {photos.length} of {total || photos.length} photos
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

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="mt-6 sm:mt-10 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 px-2 sm:px-0">
              {photos.map((photo, index) => (
                <div
                  key={`${photo.url}-${index}`}
                  className="relative w-full aspect-square cursor-pointer group overflow-hidden rounded-xl bg-white/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
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
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="px-6 py-2 text-sm"
                  size="lg"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      LOAD MORE
                    </>
                  )}
                </Button>
              </div>
            )}
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
    </div>
  );
}

