import React, { useRef, useEffect, useState, useCallback } from "react";

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  disabled = false,
  ...props
}) {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentValue = Array.isArray(value) ? value[0] : value;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const updateValue = useCallback((e) => {
    if (!sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    if (onValueChange) {
      onValueChange([clampedValue]);
    }
  }, [disabled, min, max, step, onValueChange]);

  const handleMouseDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => {
        updateValue(e);
      };
      const handleUp = () => {
        setIsDragging(false);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      return () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDragging, updateValue]);

  return (
    <div
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      {...props}
    >
      <div
        ref={sliderRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute h-5 w-5 -top-1.5 rounded-full border-2 border-primary bg-background ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${percentage}% - 10px)`,
          }}
        />
      </div>
    </div>
  );
}
