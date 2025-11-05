import { createContext, useContext, useState, useEffect } from "react";

const FullscreenContext = createContext(null);

export function FullscreenProvider({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerElement, setContainerElement] = useState(null);

  useEffect(() => {
    // Prevent ESC key from exiting fullscreen
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    // Also prevent in capture phase
    const handleKeyDownCapture = (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDownCapture, { capture: true });
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDownCapture, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If fullscreen was exited unintentionally and we want to maintain it, re-enter
      if (!isCurrentlyFullscreen && isFullscreen) {
        // This shouldn't happen often, but can happen if browser forces exit
        // We'll try to re-enter fullscreen after a short delay
        setTimeout(() => {
          const target = document.documentElement;
          if (target.requestFullscreen) {
            target.requestFullscreen().catch(() => {
              // If it fails, update state
              setIsFullscreen(false);
            });
          } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
          } else if (target.msRequestFullscreen) {
            target.msRequestFullscreen();
          }
        }, 100);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen,
        setIsFullscreen,
        containerElement,
        setContainerElement,
      }}
    >
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error("useFullscreen must be used within FullscreenProvider");
  }
  return context;
}

