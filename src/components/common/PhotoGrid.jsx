import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable PhotoGrid component for displaying photos in a grid
 */
export default function PhotoGrid({ 
  photos, 
  selectedIndex, 
  onPhotoSelect,
  className = "",
  gridCols = 2 
}) {
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center text-white/50 text-sm rounded-lg py-6 bg-black/10">
        No Photos Yet
      </div>
    );
  }

  const gridClass = gridCols === 1 ? "grid-cols-1" : gridCols === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className={cn("grid gap-2", gridClass, className)}>
      {photos.map((photo, index) => (
        <div
          key={`photo-${index}-${photo.substring(0, 20)}`}
          className={cn(
            "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
            selectedIndex === index
              ? "border-primary ring-2 ring-primary ring-offset-2"
              : "border-transparent hover:border-primary/50"
          )}
          onClick={() => onPhotoSelect?.(index)}
        >
          <img
            src={photo}
            alt={`Photo ${index + 1}`}
            className="w-full aspect-[4/3] object-cover"
          />
          {selectedIndex === index && (
            <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

