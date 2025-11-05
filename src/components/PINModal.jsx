import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Lock, X } from "lucide-react";
import { CONFIG, COLORS, DELAYS } from "@/lib/constants";

export default function PINModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      // Focus on input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, DELAYS.FOCUS_INPUT);
    }
  }, [isOpen]);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= CONFIG.PIN_LENGTH) {
      setPin(value);
      setError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === CONFIG.DEFAULT_PIN) {
      onSuccess();
      setPin("");
      setError("");
    } else {
      setError("PIN salah. Silakan coba lagi.");
      setPin("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.SECONDARY}1A` }}>
              <Lock className="h-6 w-6" style={{ color: COLORS.SECONDARY }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Masukkan PIN</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={handlePinChange}
              onKeyDown={handleKeyDown}
              placeholder="Masukkan 6 digit PIN"
              className="w-full px-4 py-3 text-2xl text-center tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: COLORS.GRAY_300 }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.SECONDARY;
                e.target.style.boxShadow = `0 0 0 2px ${COLORS.SECONDARY}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = COLORS.GRAY_300;
                e.target.style.boxShadow = '';
              }}
              maxLength={CONFIG.PIN_LENGTH}
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-white hover:text-white/80"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Masuk
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

