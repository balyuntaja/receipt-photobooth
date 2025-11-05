/**
 * Countdown overlay component for camera view
 */
export default function CountdownOverlay({ countdown }) {
  if (!countdown) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white text-5xl font-bold rounded-lg">
      {countdown}
    </div>
  );
}

