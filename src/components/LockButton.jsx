import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import PINModal from "./PINModal";
import { useFullscreen } from "@/lib/fullscreen-context";
import { DELAYS } from "@/lib/constants";

export default function LockButton({ containerRef }) {
  const location = useLocation();
  const { isFullscreen, setIsFullscreen, setContainerElement } = useFullscreen();
  const [showPINModal, setShowPINModal] = useState(false);
  
  // Update container element when route changes and ensure fullscreen persists
  useEffect(() => {
    if (containerRef?.current) {
      setContainerElement(containerRef.current);
    }
    
    // Ensure fullscreen persists across route changes
    if (isFullscreen) {
      const checkFullscreen = () => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
        
        if (!isCurrentlyFullscreen) {
          // Re-enter fullscreen if it was lost during navigation
          const target = document.documentElement;
          if (target.requestFullscreen) {
            target.requestFullscreen().catch(() => {
              setIsFullscreen(false);
            });
          } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
          } else if (target.msRequestFullscreen) {
            target.msRequestFullscreen();
          }
        }
      };
      
      // Check after a short delay to allow route transition
      const timeoutId = setTimeout(checkFullscreen, DELAYS.FULLSCREEN_CHECK);
      return () => clearTimeout(timeoutId);
    }
  }, [location, containerRef, setContainerElement, isFullscreen, setIsFullscreen]);

  const removeGradientClasses = (element) => {
    if (!element) return;
    
    // Get all elements including the element itself
    const allElements = [element, ...element.querySelectorAll('*')];
    
    allElements.forEach((el) => {
      // Skip interactive elements and important UI elements
      const tagName = el.tagName?.toLowerCase();
      const role = el.getAttribute('role');
      const isInteractive = tagName === 'button' || tagName === 'input' || tagName === 'select' || 
                           tagName === 'textarea' || tagName === 'a' || role === 'button' ||
                           role === 'link' || el.getAttribute('tabindex') !== null;
      
      if (isInteractive) {
        return; // Skip interactive elements completely
      }
      
      // Only process elements with background-image or gradient classes
      const styleAttr = el.getAttribute('style') || '';
      const hasBackgroundImage = styleAttr.includes('backgroundImage') || styleAttr.includes('background-image') || 
                                (el.style && (el.style.backgroundImage || el.style.background));
      
      const className = el.className?.toString() || '';
      const hasGradientClass = className.includes('bg-gradient') || className.includes('from-') || 
                              className.includes('via-') || className.includes('to-');
      
      if (hasBackgroundImage) {
        // Remove background-image but preserve other styles
        if (el.style) {
          el.style.removeProperty('background-image');
          el.style.removeProperty('backgroundImage');
          // Don't set white - let element keep its existing background-color or be transparent
        }
      }
      
      if (hasGradientClass) {
        // Remove gradient classes
        const classes = className.split(' ').filter(cls => cls.trim());
        const newClasses = classes.filter(cls => 
          !cls.includes('bg-gradient') && 
          !cls.includes('from-') && 
          !cls.includes('via-') && 
          !cls.includes('to-')
        );
        el.className = newClasses.join(' ');
        // Don't set white - let element keep its existing background-color or be transparent
      }
    });
  };

  useEffect(() => {
    // CSS will handle background-image removal, no need for JS manipulation
    // This prevents layout breaking and content visibility issues
    // if (isFullscreen && containerRef?.current) {
    //   setTimeout(() => {
    //     removeGradientClasses(containerRef.current);
    //   }, 50);
    // }
  }, [isFullscreen, containerRef]);

  const handleLockClick = () => {
    if (isFullscreen) {
      // Exit fullscreen - but requires PIN
      setShowPINModal(true);
    } else {
      // Enter fullscreen - no PIN required
      enterFullscreen();
    }
  };

  const enterFullscreen = () => {
    // Use document element for persistent fullscreen across routes
    const target = document.documentElement;
    
    if (target.requestFullscreen) {
      target.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // CSS will handle background-image removal automatically
      }).catch(err => {
        console.error("Error entering fullscreen:", err);
      });
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      setIsFullscreen(true);
      // CSS will handle background-image removal automatically
    } else if (target.msRequestFullscreen) {
      target.msRequestFullscreen();
      setIsFullscreen(true);
      // CSS will handle background-image removal automatically
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setShowPINModal(false);
      });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      setIsFullscreen(false);
      setShowPINModal(false);
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      setIsFullscreen(false);
      setShowPINModal(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLockClick}
        className="p-2 cursor-pointer hover:opacity-70 transition-opacity outline-none focus:outline-none"
        style={{ 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none',
          padding: '0.5rem',
          margin: 0,
          backgroundColor: 'transparent !important'
        }}
        title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
      >
        <Lock className="h-5 w-5 text-gray-500" />
      </button>

      <PINModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onSuccess={exitFullscreen}
      />
    </>
  );
}

