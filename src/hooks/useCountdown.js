import { useState } from "react";

/**
 * Custom hook for countdown timer
 */
export function useCountdown(delay = 3) {
  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const startCountdown = async (callback) => {
    setIsActive(true);
    for (let i = delay; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }
    setCountdown(null);
    setIsActive(false);
    if (callback) callback();
  };

  const stopCountdown = () => {
    setCountdown(null);
    setIsActive(false);
  };

  return {
    countdown,
    isActive,
    startCountdown,
    stopCountdown,
  };
}

