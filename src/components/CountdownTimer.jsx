import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { DELAYS } from "@/lib/constants";

export default function CountdownTimer({
  onComplete,
  duration = 3,
}) {
  const [count, setCount] = useState(duration);
  const [isVisible, setIsVisible] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    setIsVisible(true);
    completedRef.current = false;
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            // Prevent double call
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
          }, DELAYS.COUNTDOWN_COMPLETE);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      completedRef.current = false;
    };
  }, [onComplete, duration]);

  if (count === 0 && !isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className={cn(
          "transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        <div className="text-8xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          {count > 0 ? count : ""}
        </div>
      </div>
    </div>
  );
}

