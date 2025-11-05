import React from "react";
import { BUTTON_THEME, ANIMATION } from "@/lib/constants";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variantStyles = {
    default: "text-white",
    destructive: "text-white",
    outline: "text-white",
    secondary: "text-white",
    ghost: "text-white",
    link: "text-white underline-offset-4 hover:underline",
  };
  
  const sizeStyles = {
    default: "h-9 px-4 py-2",
    sm: "h-8 gap-1.5 px-3",
    lg: "h-10 px-6",
    icon: "h-9 w-9",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-10 w-10",
  };

  // Check if className contains rounded class
  const hasRoundedClass = className.includes('rounded-');
  const hasRoundedFull = className.includes('rounded-full');
  
  // Build base class string - default to rounded-full for all buttons
  const baseClassString = `${baseStyles} ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.default}`;
  const defaultRounded = hasRoundedClass ? '' : ' rounded-full';
  
  // Combine base styles with default rounded-full
  let combinedStyles = `${baseClassString}${defaultRounded}`;
  
  // If className has rounded class but not rounded-full, replace it with rounded-full
  if (hasRoundedClass && !hasRoundedFull) {
    combinedStyles = combinedStyles.replace(/\s*rounded-[^\s]*/g, ' rounded-full');
  }
  
  // Final styles: cleaned base styles + className (which has the final rounded class)
  const styles = `${combinedStyles} ${className}`.trim().replace(/\s+/g, ' ');

  // Apply uniform theme for ALL buttons using constants
  // Only apply if backgroundColor and border are not already set in props.style
  const uniformButtonStyle = !props.style?.backgroundColor && !props.style?.border && !props.style?.borderColor ? {
    backgroundColor: BUTTON_THEME.BACKGROUND,
    border: BUTTON_THEME.BORDER,
    transition: ANIMATION.TRANSITION,
  } : {};

  // If backgroundColor is set but border is not, still apply border
  const borderStyle = props.style?.backgroundColor && !props.style?.border && !props.style?.borderColor ? {
    border: BUTTON_THEME.BORDER,
  } : {};

  // Add hover class for all buttons with uniform theme
  const buttonClassName = !props.style?.backgroundColor 
    ? `${styles} btn-primary-hover`.trim().replace(/\s+/g, ' ')
    : styles;

  return (
    <button
      type={type}
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
      {...props}
      style={{
        // Always apply rounded-full via inline style for all buttons (highest priority)
        borderRadius: props.style?.borderRadius || BUTTON_THEME.BORDER_RADIUS,
        // Apply uniform theme using constants
        ...uniformButtonStyle,
        // If backgroundColor is set but border is not, still apply border
        ...borderStyle,
        // Spread props.style last to ensure it overrides everything (highest priority)
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
