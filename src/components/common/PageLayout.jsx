import { useRef } from "react";
import LockButton from "../LockButton";
import background from "@/assets/background.svg";
import { BACKGROUND_STYLES } from "@/lib/utils";

/**
 * Reusable page layout component with background and lock button
 */
export default function PageLayout({
  children,
  className = "",
  showLockButton = true,
  backgroundImage = background,
  backgroundStyles = BACKGROUND_STYLES.fullscreen,
  containerRef: externalContainerRef,
}) {
  const internalContainerRef = useRef(null);
  const containerRef = externalContainerRef || internalContainerRef;

  return (
    <div
      ref={containerRef}
      className={`h-screen overflow-hidden relative ${className}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        ...backgroundStyles,
      }}
    >
      {showLockButton && (
        <div className="absolute top-6 right-6 z-10">
          <LockButton containerRef={containerRef} />
        </div>
      )}
      {children}
    </div>
  );
}
