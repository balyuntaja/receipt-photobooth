import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { FullscreenProvider } from "./lib/fullscreen-context";
import HomeScreen from "./components/HomeScreen";
import PaymentGateway from "./components/PaymentGateway";
import TemplateSelection from "./components/TemplateSelection";
import CameraSession from "./components/CameraSession";
import PhotoSelection from "./components/PhotoSelection";
import PreviewPrint from "./components/PreviewPrint";
import PhotoResultPage from "./components/PhotoResultPage";
import AllPhotosPage from "./components/AllPhotosPage";
import { initializeTemplatePhotoAreas } from "./lib/templates";

function App() {
  // Initialize template photo area detection on app start
  useEffect(() => {
    initializeTemplatePhotoAreas().catch(console.error);
  }, []);

  return (
    <FullscreenProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/payment" element={<PaymentGateway />} />
          <Route path="/templates" element={<TemplateSelection />} />
          <Route path="/camera" element={<CameraSession />} />
          <Route path="/select-photo" element={<PhotoSelection />} />
          <Route path="/preview-print" element={<PreviewPrint />} />
          <Route path="/photo-result" element={<PhotoResultPage />} />
          <Route path="/photos" element={<AllPhotosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FullscreenProvider>
  );
}

export default App
