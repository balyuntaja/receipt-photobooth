import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ANIMATION } from "@/lib/constants";
import PageLayout from "./common/PageLayout";
import background from "@/assets/receipt-background.svg";

export default function HomeScreen() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/templates");
  };

  return (
    <PageLayout backgroundImage={background} className="flex items-center justify-center">
      <div className="flex flex-col gap-8 px-4 items-center" style={{ marginTop: "60vh" }}>
        <Button
          size="lg"
          className="w-64 h-16 px-64 text-lg animate-bounce hover:opacity-90"
          style={{ animationDuration: ANIMATION.BOUNCE_DURATION }}
          onClick={handleStart}
        >
          Tap to Start
        </Button>
      </div>
    </PageLayout>
  );
}
