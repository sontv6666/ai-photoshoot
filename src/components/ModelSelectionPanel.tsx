import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Check, Upload, Image as ImageIcon, X } from "lucide-react";

interface ModelProps {
  id: string;
  name: string;
  image: string;
  ethnicity: string;
  bodyType: string;
  style: string;
  selected?: boolean;
}

interface BackgroundProps {
  id: string;
  name: string;
  image: string;
  category: string;
  selected?: boolean;
}

interface ModelSelectionPanelProps {
  onSelectionComplete?: (
    modelIds: string[],
    backgroundIds: string[],
    modelObjects?: ModelProps[],
    backgroundObjects?: BackgroundProps[]
  ) => void;
  uploadedImages?: any[];
  initialSelectedModels?: string[];
  initialSelectedBackgrounds?: string[];
}

const ModelSelectionPanel = ({
  onSelectionComplete = () => {},
  uploadedImages = [],
  initialSelectedModels = [],
  initialSelectedBackgrounds = [],
}: ModelSelectionPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>("all");
  const [selectedBodyType, setSelectedBodyType] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    // Try to load from localStorage first, then fall back to props
    try {
      const saved = localStorage.getItem("selectedModels");
      return saved ? JSON.parse(saved) : initialSelectedModels;
    } catch {
      return initialSelectedModels;
    }
  });

  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>(
    () => {
      // Try to load from localStorage first, then fall back to props
      try {
        const saved = localStorage.getItem("selectedBackgrounds");
        return saved ? JSON.parse(saved) : initialSelectedBackgrounds;
      } catch {
        return initialSelectedBackgrounds;
      }
    },
  );
  const [activeTab, setActiveTab] = useState<"models" | "backgrounds">(
    "models",
  );

  // Custom uploaded models and backgrounds
  const [customModels, setCustomModels] = useState<ModelProps[]>(() => {
    try {
      const saved = localStorage.getItem("custom_models");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundProps[]>(() => {
    try {
      const saved = localStorage.getItem("custom_backgrounds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Mock data for models
  const models: ModelProps[] = [
    {
      id: "1",
      name: "Sophia",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      ethnicity: "asian",
      bodyType: "slim",
      style: "casual",
    },
    {
      id: "2",
      name: "Marcus",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      ethnicity: "black",
      bodyType: "athletic",
      style: "business",
    },
    {
      id: "3",
      name: "Elena",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      ethnicity: "caucasian",
      bodyType: "curvy",
      style: "elegant",
    },
    {
      id: "4",
      name: "Raj",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      ethnicity: "south_asian",
      bodyType: "slim",
      style: "casual",
    },
    {
      id: "5",
      name: "Isabella",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
      ethnicity: "hispanic",
      bodyType: "athletic",
      style: "streetwear",
    },
    {
      id: "6",
      name: "Aisha",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
      ethnicity: "middle_eastern",
      bodyType: "slim",
      style: "elegant",
    },
    {
      id: "7",
      name: "Chen",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
      ethnicity: "asian",
      bodyType: "athletic",
      style: "business",
    },
    {
      id: "8",
      name: "Zara",
      image:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
      ethnicity: "black",
      bodyType: "curvy",
      style: "streetwear",
    },
  ];

  const ethnicityOptions = [
    { value: "all", label: "All Ethnicities" },
    { value: "asian", label: "Asian" },
    { value: "black", label: "Black" },
    { value: "caucasian", label: "Caucasian" },
    { value: "hispanic", label: "Hispanic" },
    { value: "middle_eastern", label: "Middle Eastern" },
    { value: "south_asian", label: "South Asian" },
  ];

  const bodyTypeOptions = [
    { value: "all", label: "All Body Types" },
    { value: "slim", label: "Slim" },
    { value: "athletic", label: "Athletic" },
    { value: "curvy", label: "Curvy" },
  ];

  const styleOptions = [
    { value: "all", label: "All Styles" },
    { value: "casual", label: "Casual" },
    { value: "business", label: "Business" },
    { value: "elegant", label: "Elegant" },
    { value: "streetwear", label: "Streetwear" },
  ];

  // Combine default models with custom uploaded models
  const allModels = [...customModels, ...models];

  const filteredModels = allModels.filter((model) => {
    const matchesSearch = model.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesEthnicity =
      selectedEthnicity === "all" || model.ethnicity === selectedEthnicity;
    const matchesBodyType =
      selectedBodyType === "all" || model.bodyType === selectedBodyType;
    const matchesStyle =
      selectedStyle === "all" || model.style === selectedStyle;

    return matchesSearch && matchesEthnicity && matchesBodyType && matchesStyle;
  });

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  // Mock data for backgrounds
  const backgrounds: BackgroundProps[] = [
    {
      id: "1",
      name: "Urban Street",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
      category: "urban",
    },
    {
      id: "2",
      name: "Studio White",
      image:
        "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800&q=80",
      category: "studio",
    },
    {
      id: "3",
      name: "Beach Sunset",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      category: "outdoor",
    },
    {
      id: "4",
      name: "Modern Interior",
      image:
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
      category: "indoor",
    },
    {
      id: "5",
      name: "City Skyline",
      image:
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      category: "urban",
    },
    {
      id: "6",
      name: "Minimalist Studio",
      image:
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
      category: "studio",
    },
    {
      id: "7",
      name: "Forest Path",
      image:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
      category: "outdoor",
    },
    {
      id: "8",
      name: "Luxury Apartment",
      image:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      category: "indoor",
    },
  ];

  const backgroundCategories = [
    { value: "all", label: "All Categories" },
    { value: "urban", label: "Urban" },
    { value: "studio", label: "Studio" },
    { value: "outdoor", label: "Outdoor" },
    { value: "indoor", label: "Indoor" },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [backgroundSearchTerm, setBackgroundSearchTerm] = useState("");

  // Combine default backgrounds with custom uploaded backgrounds
  const allBackgrounds = [...customBackgrounds, ...backgrounds];

  // Ref to track if component just mounted (to avoid triggering on initial mount)
  const isInitialMount = useRef(true);

  // Auto-sync selections to parent whenever they change
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary callback
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Get full objects for selected models and backgrounds
    // Note: We recalculate allModels/allBackgrounds here to get latest custom items
    const currentAllModels = [...customModels, ...models];
    const currentAllBackgrounds = [...customBackgrounds, ...backgrounds];
    
    const selectedModelObjects = currentAllModels.filter(model => selectedModels.includes(model.id));
    const selectedBackgroundObjects = currentAllBackgrounds.filter(bg => selectedBackgrounds.includes(bg.id));

    // Sync to parent component
    onSelectionComplete(selectedModels, selectedBackgrounds, selectedModelObjects, selectedBackgroundObjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModels, selectedBackgrounds, customModels, customBackgrounds]);

  const filteredBackgrounds = allBackgrounds.filter((background) => {
    const matchesSearch = background.name
      .toLowerCase()
      .includes(backgroundSearchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || background.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleBackgroundToggle = (backgroundId: string) => {
    setSelectedBackgrounds((prev) => {
      if (prev.includes(backgroundId)) {
        return prev.filter((id) => id !== backgroundId);
      } else {
        return [...prev, backgroundId];
      }
    });
  };

  // Handle model upload
  const handleModelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newModel: ModelProps = {
        id: `custom-model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.split(".")[0] || "Custom Model",
        image: imageUrl,
        ethnicity: "custom",
        bodyType: "custom",
        style: "custom",
      };

      const updated = [newModel, ...customModels];
      setCustomModels(updated);
      localStorage.setItem("custom_models", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  // Handle background upload
  const handleBackgroundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newBackground: BackgroundProps = {
        id: `custom-bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.split(".")[0] || "Custom Background",
        image: imageUrl,
        category: "custom",
      };

      const updated = [newBackground, ...customBackgrounds];
      setCustomBackgrounds(updated);
      localStorage.setItem("custom_backgrounds", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  // Delete custom model
  const handleDeleteCustomModel = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customModels.filter((m) => m.id !== modelId);
    setCustomModels(updated);
    localStorage.setItem("custom_models", JSON.stringify(updated));
    // Also remove from selection if selected
    setSelectedModels((prev) => prev.filter((id) => id !== modelId));
  };

  // Delete custom background
  const handleDeleteCustomBackground = (bgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customBackgrounds.filter((b) => b.id !== bgId);
    setCustomBackgrounds(updated);
    localStorage.setItem("custom_backgrounds", JSON.stringify(updated));
    // Also remove from selection if selected
    setSelectedBackgrounds((prev) => prev.filter((id) => id !== bgId));
  };

  const handleContinue = () => {
    // Validate selections before continuing
    if (selectedModels.length === 0 || selectedBackgrounds.length === 0) {
      return;
    }

    // Save selections to localStorage for persistence
    try {
      localStorage.setItem("selectedModels", JSON.stringify(selectedModels));
      localStorage.setItem(
        "selectedBackgrounds",
        JSON.stringify(selectedBackgrounds),
      );
    } catch (error) {
      console.error("Error saving selections to localStorage:", error);
    }

    // Get full objects for selected models and backgrounds
    const selectedModelObjects = allModels.filter(model => selectedModels.includes(model.id));
    const selectedBackgroundObjects = allBackgrounds.filter(bg => selectedBackgrounds.includes(bg.id));

    onSelectionComplete(selectedModels, selectedBackgrounds, selectedModelObjects, selectedBackgroundObjects);
  };

  return (
    <div className="w-full h-full bg-background p-6 rounded-lg">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Select Models & Backgrounds</h2>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {selectedModels.length} models, {selectedBackgrounds.length}{" "}
              backgrounds selected
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={handleContinue}
              disabled={
                selectedModels.length === 0 || selectedBackgrounds.length === 0
              }
            >
              Continue
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="models"
          className="w-full"
          onValueChange={(value) =>
            setActiveTab(value as "models" | "backgrounds")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="pt-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery">Gallery View</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Upload Model Card */}
                    <Card className="overflow-hidden cursor-pointer border-2 border-dashed hover:border-primary transition-colors">
                      <Label htmlFor="model-upload" className="cursor-pointer">
                        <div className="relative aspect-[3/4] w-full bg-muted/30 flex items-center justify-center">
                          <div className="text-center p-4">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Upload Model</p>
                            <p className="text-xs text-muted-foreground mt-1">Thêm hình model mới</p>
                          </div>
                        </div>
                        <Input
                          id="model-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleModelUpload(file);
                              e.target.value = ""; // Reset input
                            }
                          }}
                        />
                      </Label>
                    </Card>

                    {filteredModels.map((model) => (
                      <Card
                        key={model.id}
                        className={`overflow-hidden cursor-pointer transition-all relative ${selectedModels.includes(model.id) ? "ring-2 ring-primary" : ""}`}
                        onClick={() => handleModelToggle(model.id)}
                      >
                        <div className="relative aspect-[3/4] w-full">
                          <img
                            src={model.image}
                            alt={model.name}
                            className="object-cover w-full h-full"
                          />
                          {selectedModels.includes(model.id) && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                          {model.id.startsWith("custom-") && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 left-2 h-6 w-6"
                              onClick={(e) => handleDeleteCustomModel(model.id, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{model.name}</h3>
                              <p className="text-xs text-muted-foreground capitalize">
                                {model.style} • {model.bodyType}
                              </p>
                            </div>
                            <Checkbox
                              checked={selectedModels.includes(model.id)}
                              onCheckedChange={() =>
                                handleModelToggle(model.id)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredModels.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <p>No models match your current filters</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedEthnicity("all");
                          setSelectedBodyType("all");
                          setSelectedStyle("all");
                        }}
                      >
                        Reset all filters
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="filters" className="mt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ethnicity</h3>
                    <Select
                      value={selectedEthnicity}
                      onValueChange={setSelectedEthnicity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ethnicityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Body Type</h3>
                    <Select
                      value={selectedBodyType}
                      onValueChange={setSelectedBodyType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Style</h3>
                    <Select
                      value={selectedStyle}
                      onValueChange={setSelectedStyle}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {styleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedEthnicity("all");
                        setSelectedBodyType("all");
                        setSelectedStyle("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Button
                      onClick={() => {
                        // Apply filters and switch to gallery view
                        const galleryTab = document.querySelector('[data-value="gallery"]') as HTMLElement;
                        if (galleryTab) {
                          galleryTab.click();
                        }
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="backgrounds" className="pt-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search backgrounds"
                  value={backgroundSearchTerm}
                  onChange={(e) => setBackgroundSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {backgroundCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Upload Background Card */}
                <Card className="overflow-hidden cursor-pointer border-2 border-dashed hover:border-primary transition-colors">
                  <Label htmlFor="background-upload" className="cursor-pointer">
                    <div className="relative aspect-video w-full bg-muted/30 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Upload Background</p>
                        <p className="text-xs text-muted-foreground mt-1">Thêm hình background mới</p>
                      </div>
                    </div>
                    <Input
                      id="background-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleBackgroundUpload(file);
                          e.target.value = ""; // Reset input
                        }
                      }}
                    />
                  </Label>
                </Card>

                {filteredBackgrounds.map((background) => (
                  <Card
                    key={background.id}
                    className={`overflow-hidden cursor-pointer transition-all relative ${selectedBackgrounds.includes(background.id) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleBackgroundToggle(background.id)}
                  >
                    <div className="relative aspect-video w-full">
                      <img
                        src={background.image}
                        alt={background.name}
                        className="object-cover w-full h-full"
                      />
                      {selectedBackgrounds.includes(background.id) && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      {background.id.startsWith("custom-") && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 left-2 h-6 w-6"
                          onClick={(e) => handleDeleteCustomBackground(background.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{background.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {background.category}
                          </p>
                        </div>
                        <Checkbox
                          checked={selectedBackgrounds.includes(background.id)}
                          onCheckedChange={() =>
                            handleBackgroundToggle(background.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filteredBackgrounds.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No backgrounds match your current filters</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setBackgroundSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    Reset all filters
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelSelectionPanel;
