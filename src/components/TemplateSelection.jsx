import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateSessionId } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { templates as importedTemplates, PRINT_DIMENSIONS } from "@/lib/templates";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import PageLayout from "./common/PageLayout";

const fallbackTemplates = [
  {
    id: "template-1",
    name: "Template Classic",
    previewImage: "/placeholder-template-1.png",
    templateImage: "/placeholder-template-1.png",
    dimensions: { width: 218, height: 400 },
  },
  {
    id: "template-2",
    name: "Template Modern",
    previewImage: "/placeholder-template-2.png",
    templateImage: "/placeholder-template-2.png",
    dimensions: { width: 218, height: 400 },
  },
  {
    id: "template-3",
    name: "Template Minimal",
    previewImage: "/placeholder-template-3.png",
    templateImage: "/placeholder-template-3.png",
    dimensions: { width: 218, height: 400 },
  },
];

const templates = importedTemplates && importedTemplates.length > 0 ? importedTemplates : fallbackTemplates;

export default function TemplateSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const printCount = location.state?.printCount || 1; // Default to 1 if not provided
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const containerRef = useRef(null);

  // Generate new sessionId when user selects a template (starts new photo session)
  useEffect(() => {
    // Only reset if user is coming from home (not from back button)
    const newSessionId = generateSessionId();
    sessionStorage.setItem("photobooth_sessionId", newSessionId);
    console.log("New photo session started:", newSessionId);
  }, []);

  const handleNext = () => {
    if (selectedTemplate) {
      navigate("/camera", { state: { templateId: selectedTemplate, printCount } });
    }
  };

  const handleBack = () => {
    navigate("/payment", { state: { printCount } });
  };

  if (!templates || templates.length === 0) {
    return (
      <PageLayout containerRef={containerRef}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4 text-white">Tidak ada template tersedia</h1>
            <Button onClick={handleBack}>Kembali ke Home</Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout containerRef={containerRef}>
      <div className="container mx-auto max-w-6xl py-5" style={{ width: "100%", maxWidth: "1152px" }}>
        {/* Header */}
        {/* Tablet: Header lebih kompak */}
        <div className="mb-8 flex items-center justify-between template-selection-header">
          {/* Back Button - Left */}
          <Button variant="ghost" onClick={handleBack} className="text-white hover:text-white/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Title & Description - Center */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white">Pilih Template Photostrip</h1>
            <p className="mt-2 text-white">Pilih salah satu template untuk hasil cetak Anda</p>
          </div>

          {/* Continue Button - Right */}
          <Button onClick={handleNext} disabled={!selectedTemplate} size="lg">
            Continue
          </Button>
        </div>

        {/* Template Grid */}
        {/* Tablet: Grid layout lebih kompak untuk muat dalam satu layar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 template-selection-grid">
          {templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg py-2 bg-black/10",
                  selectedTemplate === template.id
                    ? "bg-primary border-2 border-white"
                    : "bg-primary/80 border-2 border-transparent"
                )}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-8/11 bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={template.previewImage}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<p class="text-muted-foreground text-sm">${template.name}</p>`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-muted-foreground text-white">
                      {PRINT_DIMENSIONS.widthCM}cm x {PRINT_DIMENSIONS.heightCM}cm
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Memuat template...</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
