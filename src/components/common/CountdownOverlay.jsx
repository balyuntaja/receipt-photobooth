/**
 * Countdown overlay component for camera view
 */
export default function CountdownOverlay({ countdown }) {
  if (!countdown) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white text-7xl font-bold rounded-lg" style={{
      textShadow: "0 0 15px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6)"
    }}>
      {countdown}
    </div>
  );
}

