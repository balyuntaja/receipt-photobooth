import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ANIMATION } from "@/lib/constants";
import { generateSessionId } from "@/lib/api";
import { Settings } from "lucide-react";
import PageLayout from "./common/PageLayout";
import CameraSettingModal from "./CameraSettingModal";
import background from "@/assets/background.svg";
import title from "@/assets/title.png";
import subtitle from "@/assets/subtitle.png";
import logo from "@/assets/logo-putih.png";

export default function HomeScreen() {
  const navigate = useNavigate();
  const [showCameraSettings, setShowCameraSettings] = useState(false);

  // Reset sessionId when user returns to home (starts new session)
  useEffect(() => {
    // Get old sessionId before replacing it
    const oldSessionId = sessionStorage.getItem("photobooth_sessionId");
    // Generate new sessionId
    const newSessionId = generateSessionId();
    sessionStorage.setItem("photobooth_sessionId", newSessionId);
    // Clear upload status for old session
    if (oldSessionId) {
      sessionStorage.removeItem(`uploaded_${oldSessionId}`);
    }
    console.log("New session started:", newSessionId);
  }, []);

  const handleStart = () => {
    navigate("/payment");
  };

  const handleSettingsClick = () => {
    setShowCameraSettings(true);
  };

  return (
    <PageLayout backgroundImage={background} className="flex flex-col items-center justify-between relative h-screen">
      {/* Settings button - only on HomeScreen */}
      <div className="absolute top-6 right-20 z-10">
        <button
          onClick={handleSettingsClick}
          className="p-2 cursor-pointer hover:opacity-70 transition-opacity outline-none focus:outline-none"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            boxShadow: 'none',
            padding: '0.5rem',
            margin: 0,
            backgroundColor: 'transparent !important'
          }}
          title="Settings"
        >
          <Settings className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Camera Settings Modal */}
      <CameraSettingModal 
        open={showCameraSettings} 
        onClose={() => setShowCameraSettings(false)} 
      />

      {/* Logo at top center */}
      <div className="flex justify-center pt-8">
        <img src={logo} alt="Logo" className="h-12 object-contain" />
      </div>

      {/* Title, Button, and Subtitle in center */}
      {/* Tablet: Spacing lebih kompak untuk muat dalam satu layar */}
      <div className="flex flex-col gap-8 px-4 items-center justify-center flex-1 pt-16 home-screen-content">
        {/* Title in center */}
        <img src={title} alt="Title" className="max-w-md w-full object-contain mb-12 home-screen-title" />
        
        {/* Button */}
        <Button
          size="lg"
          className="w-64 h-16 px-64 text-lg animate-bounce hover:opacity-90 home-screen-button"
          style={{ animationDuration: ANIMATION.BOUNCE_DURATION }}
          onClick={handleStart}
        >
          Tap to Start
        </Button>

        {/* Subtitle below button */}
        <img src={subtitle} alt="Subtitle" className="max-w-md w-full object-contain pt-12 home-screen-subtitle" />
      </div>
    </PageLayout>
  );
}
