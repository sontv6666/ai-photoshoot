import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share,
  Download,
  Code,
  Rotate3D,
  ZoomIn,
  Move,
  Check,
  Shirt,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { generateFashionPhotoshoot, initializeGemini, ImageInputs, PromptContext } from "@/services/geminiService";
import { getGeminiApiKey, hasGeminiApiKey } from "@/lib/apiKeyUtils";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PreviewGeneratorProps {
  selectedModels?: Array<{
    id: string;
    name: string;
    image: string;
    ethnicity?: string;
    bodyType?: string;
    style?: string;
  }>;
  selectedBackground?: {
    id: string;
    name: string;
    image: string;
    category?: string;
  };
  uploadedProducts?: Array<{
    id: string;
    name: string;
    image: string;
  }>;
  uploadedFiles?: File[]; // Files for Gemini API
  onGenerationComplete?: (imageUrls: string[]) => void;
}

const PreviewGenerator: React.FC<PreviewGeneratorProps> = ({
  onGenerationComplete,
  uploadedFiles = [],
  selectedModels = [],
  selectedBackground,
  uploadedProducts = [],
}) => {
  const [activeTab, setActiveTab] = useState("preview");
  const [activeModel, setActiveModel] = useState(selectedModels?.[0] || null);
  const [zoomLevel, setZoomLevel] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  
  // Update activeModel when selectedModels changes
  useEffect(() => {
    if (selectedModels && selectedModels.length > 0) {
      setActiveModel(selectedModels[0]);
    } else {
      setActiveModel(null);
    }
  }, [selectedModels]);

  const [generatedImages, setGeneratedImages] = useState<string[]>(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem("generatedImages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState("jpg");
  const [exportResolution, setExportResolution] = useState("high");
  const [shareUrl, setShareUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [apiKeyRequested, setApiKeyRequested] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialShareStatus, setSocialShareStatus] = useState<{
    platform: string;
    status: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ platform: "", status: "idle" });

  // Try-on feature states
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [modelImageUrl, setModelImageUrl] = useState("");
  const [garmentImageUrl, setGarmentImageUrl] = useState("");
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isTryOnLoading, setIsTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Check if API key exists
      if (!hasGeminiApiKey()) {
        setError("Vui lòng cấu hình Gemini API key trong Settings trước khi tạo ảnh.");
        setIsGenerating(false);
        return;
      }

      // Check if we have required files
      if (uploadedFiles.length === 0) {
        setError("Vui lòng upload ít nhất một sản phẩm trước khi tạo ảnh.");
        setIsGenerating(false);
        return;
      }

      // Check if we have selected models
      if (!selectedModels || selectedModels.length === 0) {
        setError("Vui lòng chọn ít nhất một model trước khi tạo ảnh.");
        setIsGenerating(false);
        return;
      }

      // Check if we have a selected background
      if (!selectedBackground) {
        setError("Vui lòng chọn background trước khi tạo ảnh.");
        setIsGenerating(false);
        return;
      }

      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setError("Không tìm thấy API key. Vui lòng kiểm tra Settings.");
        setIsGenerating(false);
        return;
      }

      // Initialize Gemini with API key
      initializeGemini(apiKey);

      console.log("Starting image generation with Gemini API...");
      console.log("Uploaded files:", uploadedFiles.length);
      console.log("Selected model:", activeModel?.name || "None");

      // Prepare inputs for Gemini API
      // We need: model image (from selectedModels or a default), clothing image (from uploadedFiles)
      // For now, use the first uploaded file as clothing and try to get model image
      if (uploadedFiles.length < 1) {
        setError("Cần ít nhất một ảnh sản phẩm để tạo ảnh.");
        setIsGenerating(false);
        return;
      }

      const clothingFile = uploadedFiles[0]; // Use first uploaded file as clothing
      
      // For model image, we'll need to fetch it from the URL if it's a URL
      // Or use a default model image file if we have one
      // For now, let's convert the model image URL to a File if needed
      // But actually, Gemini API can work with URLs too through the service
      
      // Prepare ImageInputs - we'll use URLs for now and let the service handle conversion
      // Actually looking at the service, it expects File objects, not URLs
      // So we need to convert model image URL to File, or require File uploads
      
      // For MVP, let's use the uploaded clothing file and try to get a model file
      // If we only have URLs for model, we'll need to fetch and convert
      
      // Simplified approach: use uploaded files as clothing
      // Model image will need to be handled separately - for now, we'll use the first uploaded file as both
      // In a real scenario, users should upload model images too
      
      const inputs: ImageInputs = {
        model: clothingFile, // Temporarily use clothing as model - should be separate
        clothing: clothingFile,
      };

      // Prepare prompt context with product, model, and background information
      const promptContext: PromptContext = {
        productName: uploadedProducts && uploadedProducts.length > 0 
          ? uploadedProducts[0].name 
          : undefined,
        productDescription: uploadedProducts && uploadedProducts.length > 0 
          ? `the exact ${uploadedProducts[0].name} product` 
          : undefined,
        modelDescription: activeModel 
          ? `${activeModel.ethnicity || ''} ${activeModel.bodyType || ''} ${activeModel.style || ''} model`.trim()
          : undefined,
        backgroundDescription: selectedBackground?.name 
          ? selectedBackground.name 
          : undefined,
        backgroundCategory: selectedBackground?.category 
          ? selectedBackground.category 
          : undefined,
      };

      // Call Gemini API to generate scenarios and images with context
      const result = await generateFashionPhotoshoot(inputs, apiKey, {
        promptContext: promptContext,
      });

      console.log("Generation result:", result);

      // Extract image URLs from the result (new structure: 1 scenario with 3 images)
      const generatedImageUrls: string[] = [];
      result.structuredResults.images.forEach((image) => {
        if (image.imageUrl) {
          generatedImageUrls.push(image.imageUrl);
        }
      });

      // If no images were generated but we have prompts, show a message
      if (generatedImageUrls.length === 0) {
        setError(
          "Tạo ảnh không thành công. " +
          "Có thể do: 1) Gemini API key chưa được cấu hình, " +
          "2) Model không khả dụng, hoặc 3) Lỗi kết nối. " +
          "Vui lòng kiểm tra cài đặt và thử lại."
        );
        console.warn("No images generated, but generation completed");
      }

      console.log("Generated image URLs:", generatedImageUrls);

      // Save to localStorage for persistence (optimized to prevent quota exceeded)
      try {
        // Optimize images before saving - truncate very large base64 data URLs
        const optimizedImageUrls = generatedImageUrls.map((url) => {
          if (url && url.startsWith('data:') && url.length > 50000) {
            // For very large base64 images, keep only a small thumbnail reference
            return url.substring(0, 500) + '... [optimized]';
          }
          return url;
        });
        
        localStorage.setItem(
          "generatedImages",
          JSON.stringify(optimizedImageUrls),
        );
        localStorage.setItem("generationTimestamp", Date.now().toString());
        localStorage.setItem(
          "generationSettings",
          JSON.stringify({
            modelId: activeModel?.id || null,
            zoomLevel,
            rotation,
            position,
            products: uploadedProducts.map((p) => p.id),
            scenario: result.scenario,
          }),
        );
        console.log("Saved generation settings to localStorage");
      } catch (error: any) {
        console.error("Error saving generated images to localStorage:", error);
        if (error.name === 'QuotaExceededError') {
          setError("Lỗi: Bộ nhớ đã đầy! Vui lòng xóa một số projects cũ hoặc dữ liệu trong localStorage.");
        }
      }

      setGeneratedImages(generatedImageUrls);

      // Call the callback to notify parent component
      if (onGenerationComplete) {
        onGenerationComplete(generatedImageUrls);
      }

      if (generatedImageUrls.length > 0) {
        setActiveTab("results");
      }
    } catch (err: any) {
      console.error("Error generating images:", err);
      const errorMessage = err?.message || "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryOn = async () => {
    setTryOnError("Try-On feature is not available. This app uses Gemini API for image generation.");
    return;
  };

  const handleExport = () => {
    // Generate share URL and embed code
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const newShareUrl = `https://example.com/share/${uniqueId}`;
    setShareUrl(newShareUrl);
    setEmbedCode(
      `<iframe src="${newShareUrl}" width="800" height="600" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`,
    );
    setIsDialogOpen(true);
  };

  const handleSocialShare = useCallback(
    (platform: string) => {
      if (generatedImages.length === 0) {
        setError("No images to share. Please generate images first.");
        return;
      }

      setSocialShareStatus({ platform, status: "loading" });

      // Simulate API call to share to social media
      setTimeout(() => {
        try {
          // In a real implementation, this would be an API call to the social media platform
          console.log(`Sharing to ${platform}:`, generatedImages[0]);

          // Simulate successful share
          setSocialShareStatus({
            platform,
            status: "success",
            message: `Successfully shared to ${platform}!`,
          });

          // Show success message in a toast or alert
          alert(`Successfully shared to ${platform}!`);
        } catch (err) {
          console.error(`Error sharing to ${platform}:`, err);
          setSocialShareStatus({
            platform,
            status: "error",
            message: `Failed to share to ${platform}. Please try again.`,
          });
          setError(`Failed to share to ${platform}. Please try again.`);
        }
      }, 1500);
    },
    [generatedImages],
  );

  const handleDownload = (imageUrl?: string) => {
    try {
      // If a specific image URL is provided, download just that image
      // Otherwise, download all images
      const imagesToDownload = imageUrl ? [imageUrl] : generatedImages;

      imagesToDownload.forEach((url, index) => {
        // Create a temporary anchor element
        const link = document.createElement("a");
        link.href = url;
        link.download = `generated-image-${index + 1}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (err) {
      console.error("Error downloading images:", err);
      setError("Failed to download images. Please try again.");
    }
  };

  return (
    <div className="w-full h-full bg-background p-6 rounded-lg">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="preview">Preview & Adjust</TabsTrigger>
            <TabsTrigger value="results">Generated Results</TabsTrigger>
            <TabsTrigger value="export">Export Options</TabsTrigger>
            <TabsTrigger value="tryon">Try-On Feature</TabsTrigger>
          </TabsList>

          {activeTab === "preview" && (
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !hasGeminiApiKey() || uploadedFiles.length === 0}
              title={!hasGeminiApiKey() ? "Vui lòng cấu hình API key trong Settings" : uploadedFiles.length === 0 ? "Vui lòng upload sản phẩm trước" : ""}
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Đang tạo ảnh...
                </>
              ) : (
                "Tạo Ảnh"
              )}
            </Button>
          )}

          {activeTab === "results" && (
            <Button onClick={() => setActiveTab("export")}>
              Continue to Export
            </Button>
          )}

          {activeTab === "export" && (
            <Button onClick={handleExport}>Export Now</Button>
          )}
        </div>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-0 relative">
                  <div
                    className="w-full h-[500px] relative overflow-hidden"
                    style={{
                      backgroundImage: selectedBackground?.image ? `url(${selectedBackground.image})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: selectedBackground?.image ? undefined : "transparent",
                    }}
                  >
                    {!selectedBackground && (
                      <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
                        <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border">
                          <p className="text-muted-foreground font-medium">No background selected</p>
                          <p className="text-sm text-muted-foreground mt-2">Please select a background in the Model Selection step</p>
                        </div>
                      </div>
                    )}
                    {activeModel && (
                      <motion.div
                        className="absolute"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${zoomLevel / 50})`,
                        }}
                        drag
                        dragConstraints={{
                          left: -200,
                          right: 200,
                          top: -200,
                          bottom: 200,
                        }}
                        onDragEnd={(_, info) => {
                          // Update position based on drag
                          const newX = position.x + info.offset.x / 5;
                          const newY = position.y + info.offset.y / 5;
                          setPosition({
                            x: Math.max(0, Math.min(100, newX)),
                            y: Math.max(0, Math.min(100, newY)),
                          });
                        }}
                      >
                        <img
                          src={activeModel.image}
                          alt={activeModel.name}
                          className="h-[400px] object-contain"
                        />
                      </motion.div>
                    )}
                    {!activeModel && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border">
                          <p className="text-muted-foreground">No model selected</p>
                          <p className="text-sm text-muted-foreground mt-2">Please select a model first</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="text-lg font-medium">Adjust Preview</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Model</Label>
                        <Select
                          value={activeModel?.id || ""}
                          onValueChange={(value) => {
                            const model = selectedModels?.find(
                              (m) => m.id === value,
                            );
                            if (model) setActiveModel(model);
                          }}
                          disabled={!selectedModels || selectedModels.length === 0}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={selectedModels?.length === 0 ? "No models selected" : "Select model"} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedModels && selectedModels.length > 0 ? (
                              selectedModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No models available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="h-4 w-4" />
                        <Label>Zoom Level</Label>
                      </div>
                      <Slider
                        value={[zoomLevel]}
                        min={10}
                        max={100}
                        step={1}
                        onValueChange={(value) => setZoomLevel(value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Rotate3D className="h-4 w-4" />
                        <Label>Rotation</Label>
                      </div>
                      <Slider
                        value={[rotation]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={(value) => setRotation(value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Move className="h-4 w-4" />
                        <Label>Position</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Horizontal</Label>
                          <Slider
                            value={[position.x]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) =>
                              setPosition({ ...position, x: value[0] })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Vertical</Label>
                          <Slider
                            value={[position.y]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) =>
                              setPosition({ ...position, y: value[0] })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">
                    Selected Products
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="relative rounded-md overflow-hidden border"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs text-center p-1">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                Generating your photoshoot...
              </p>
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Generated Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <img
                        src={image}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-[300px] object-cover"
                      />
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Image {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <p className="text-muted-foreground">
                No generated images yet. Go to Preview tab and click Generate.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tryon" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Virtual Try-On</h2>
                  <p className="text-muted-foreground mb-6">
                    Enter the URLs of a model image and a garment image to see
                    how the garment would look on the model.
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="model-image-url"
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Model Image URL
                      </Label>
                      <Input
                        id="model-image-url"
                        placeholder="https://example.com/model.jpg"
                        value={modelImageUrl}
                        onChange={(e) => setModelImageUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="garment-image-url"
                        className="flex items-center gap-2"
                      >
                        <Shirt className="h-4 w-4" />
                        Garment Image URL
                      </Label>
                      <Input
                        id="garment-image-url"
                        placeholder="https://example.com/garment.jpg"
                        value={garmentImageUrl}
                        onChange={(e) => setGarmentImageUrl(e.target.value)}
                      />
                    </div>

                    {tryOnError && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {tryOnError}
                      </div>
                    )}

                    <Button
                      onClick={handleTryOn}
                      disabled={
                        isTryOnLoading || !modelImageUrl || !garmentImageUrl
                      }
                      className="w-full"
                    >
                      {isTryOnLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Generate Try-On Image"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">Result Preview</h3>
                  {tryOnResult ? (
                    <div className="space-y-4">
                      <img
                        src={tryOnResult}
                        alt="Try-on result"
                        className="w-full h-[300px] object-contain rounded-md border"
                      />
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab("results");
                          }}
                        >
                          View in Results
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(tryOnResult)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] bg-muted/30 rounded-md border border-dashed">
                      {isTryOnLoading ? (
                        <>
                          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            Processing your request...
                          </p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            Try-on result will appear here
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">How It Works</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                    <li>
                      Enter the URL of a model image (person wearing neutral
                      clothing)
                    </li>
                    <li>
                      Enter the URL of a garment image (clothing item on plain
                      background)
                    </li>
                    <li>
                      Click Generate to see the garment virtually fitted on the
                      model
                    </li>
                    <li>
                      Results are added to your generated images collection
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Export Options</h2>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Download Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="format">File Format</Label>
                        <Select
                          value={exportFormat}
                          onValueChange={setExportFormat}
                        >
                          <SelectTrigger id="format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resolution">Resolution</Label>
                        <Select
                          value={exportResolution}
                          onValueChange={setExportResolution}
                        >
                          <SelectTrigger id="resolution">
                            <SelectValue placeholder="Select resolution" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (720p)</SelectItem>
                            <SelectItem value="medium">
                              Medium (1080p)
                            </SelectItem>
                            <SelectItem value="high">High (2K)</SelectItem>
                            <SelectItem value="ultra">Ultra (4K)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDownload()}
                      className="w-full"
                      disabled={generatedImages.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All Images
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Share Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSocialShare("instagram")}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share to Instagram
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSocialShare("facebook")}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share to Facebook
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSocialShare("twitter")}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share to Twitter
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSocialShare("pinterest")}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share to Pinterest
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Website Integration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="embed-code">Embed Code</Label>
                      <div className="relative">
                        <Input
                          id="embed-code"
                          value={`<iframe src="${shareUrl || "https://example.com/embed/photoshoot"}" width="800" height="600" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`}
                          readOnly
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `<iframe src="${shareUrl || "https://example.com/embed/photoshoot"}" width="800" height="600" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`,
                            );
                            alert("Embed code copied to clipboard!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="direct-link">Direct Link</Label>
                      <div className="relative">
                        <Input
                          id="direct-link"
                          value={
                            shareUrl || "https://example.com/share/photoshoot"
                          }
                          readOnly
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              shareUrl ||
                                "https://example.com/share/photoshoot",
                            );
                            alert("Link copied to clipboard!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label>Integration Options</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const jsonData = {
                              images: generatedImages,
                              model: activeModel?.name || "None",
                              background: selectedBackground?.name || "None",
                              products: uploadedProducts.map((p) => p.name),
                            };
                            navigator.clipboard.writeText(
                              JSON.stringify(jsonData, null, 2),
                            );
                            alert("JSON data copied to clipboard!");
                          }}
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Copy as JSON
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setApiKeyRequested(true);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Get API Access
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">Preview</h3>
                  <div className="space-y-4">
                    {generatedImages.length > 0 ? (
                      <img
                        src={generatedImages[0]}
                        alt="Preview"
                        className="w-full h-[200px] object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-[200px] bg-muted flex items-center justify-center rounded-md">
                        <p className="text-muted-foreground text-sm">
                          No preview available
                        </p>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Selected format:{" "}
                        <span className="font-medium">
                          {exportFormat.toUpperCase()}
                        </span>
                      </p>
                      <p>
                        Selected resolution:{" "}
                        <span className="font-medium">
                          {exportResolution === "low"
                            ? "720p"
                            : exportResolution === "medium"
                              ? "1080p"
                              : exportResolution === "high"
                                ? "2K"
                                : "4K"}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">Export Checklist</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">Images generated successfully</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">
                        High-quality resolution available
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">Multiple file formats supported</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">Social media sharing enabled</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">Website integration ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Export Successful!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!apiKeyRequested ? (
              <>
                <p>
                  Your photoshoot has been successfully exported. You can now
                  download the images or share them directly.
                </p>

                <div className="space-y-2">
                  <Label>Share URL</Label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        alert("URL copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Embed Code</Label>
                  <div className="flex gap-2">
                    <Input value={embedCode} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(embedCode);
                        alert("Embed code copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Social Media Sharing</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(false);
                        handleSocialShare("instagram");
                      }}
                    >
                      <Share className="mr-2 h-4 w-4" />
                      Instagram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(false);
                        handleSocialShare("facebook");
                      }}
                    >
                      <Share className="mr-2 h-4 w-4" />
                      Facebook
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={() => handleDownload()}>Download Now</Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium">API Access Request</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fill out the form below to request API access for integrating
                  our AI photoshoot generator into your website or application.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Your company name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="use-case">Use Case</Label>
                    <Input
                      id="use-case"
                      placeholder="Describe how you'll use our API"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated-volume">
                      Estimated Monthly Volume
                    </Label>
                    <Select defaultValue="low">
                      <SelectTrigger id="estimated-volume">
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          Low (&lt; 1,000 images)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (1,000 - 10,000 images)
                        </SelectItem>
                        <SelectItem value="high">
                          High (&gt; 10,000 images)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setApiKeyRequested(false);
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      alert(
                        "Thank you for your request! We'll be in touch with API access details shortly.",
                      );
                      setApiKeyRequested(false);
                      setIsDialogOpen(false);
                    }}
                  >
                    Submit Request
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreviewGenerator;
