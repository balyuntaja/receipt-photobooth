/**
 * Theme Colors
 * Centralized color definitions for easy maintenance
 */
export const COLORS = {
  PRIMARY: '#99b3fc',
  PRIMARY_DARK: '#5a3d31',
  SECONDARY: '#6b4b3e',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Common used colors
  GRAY_300: '#d1d5db',
  GRAY_900: '#111827',
} as const;

/**
 * Button Theme
 */
export const BUTTON_THEME = {
  BACKGROUND: COLORS.PRIMARY,
  BORDER: `3px solid ${COLORS.WHITE}`,
  TEXT: COLORS.WHITE,
  HOVER_OPACITY: 0.9,
  BORDER_RADIUS: '9999px', // rounded-full
} as const;

/**
 * Border Styles
 */
export const BORDER = {
  PRIMARY: `3px solid ${COLORS.PRIMARY}`,
  WHITE: `3px solid ${COLORS.WHITE}`,
  TRANSPARENT: '3px solid transparent',
} as const;

/**
 * Animation Durations
 */
export const ANIMATION = {
  BOUNCE_DURATION: '2s',
  TRANSITION: '0.2s ease-in-out',
} as const;

/**
 * Z-Index Layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  OVERLAY: 50,
  MODAL: 100,
} as const;

/**
 * Timeouts and Delays (in milliseconds)
 */
export const DELAYS = {
  FOCUS_INPUT: 100,
  CAPTURE_DELAY: 200,
  FULLSCREEN_CHECK: 100,
  COUNTDOWN_COMPLETE: 300,
  PRINT_LOAD: 1000,
} as const;

/**
 * Security/Configuration
 */
export const CONFIG = {
  DEFAULT_PIN: "210702",
  MAX_PHOTOS: 3,
  PIN_LENGTH: 6,
} as const;

