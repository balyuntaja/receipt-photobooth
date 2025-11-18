import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ANIMATION } from "@/lib/constants";
import { generateSessionId } from "@/lib/api";
import PageLayout from "./common/PageLayout";
import background from "@/assets/background.svg";
import title from "@/assets/title.png";
import subtitle from "@/assets/subtitle.png";
import logo from "@/assets/logo-putih.png";

export default function HomeScreen() {
  const navigate = useNavigate();

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
    navigate("/templates");
  };

  return (
    <PageLayout backgroundImage={background} className="flex flex-col items-center justify-between relative h-screen">
      {/* Logo at top center */}
      <div className="flex justify-center pt-8">
        <img src={logo} alt="Logo" className="h-12 object-contain" />
      </div>

      {/* Title, Button, and Subtitle in center */}
      <div className="flex flex-col gap-8 px-4 items-center justify-center flex-1 pt-16">
        {/* Title in center */}
        <img src={title} alt="Title" className="max-w-md w-full object-contain mb-12" />
        
        {/* Button */}
        <Button
          size="lg"
          className="w-64 h-16 px-64 text-lg animate-bounce hover:opacity-90"
          style={{ animationDuration: ANIMATION.BOUNCE_DURATION }}
          onClick={handleStart}
        >
          Tap to Start
        </Button>

        {/* Subtitle below button */}
        <img src={subtitle} alt="Subtitle" className="max-w-md w-full object-contain pt-12" />
      </div>
    </PageLayout>
  );
}
