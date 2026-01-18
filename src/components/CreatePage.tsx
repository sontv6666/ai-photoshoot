import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PhotoshootCreator from "./PhotoshootCreator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import {
  getProjectById,
  saveProject,
  generateProjectId,
  Project,
} from "@/lib/projectStorage";

export default function CreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    // If we have an ID, this is an edit operation
    if (id) {
      // Load project from localStorage
      const project = getProjectById(id);
      if (project) {
        setProjectData({
          title: project.title,
          uploadedImages: project.uploadedFiles || [],
          selectedModels: project.selectedModels || [],
          selectedBackgrounds: project.selectedBackgrounds || [],
          generatedImages: project.generatedImages || [],
          scenarios: project.scenarios,
        });
      } else {
        // Project not found, redirect to dashboard
        navigate("/dashboard");
        return;
      }
      setIsLoading(false);
    } else {
      // New project, no need to fetch data
      setIsLoading(false);
    }
  }, [id, navigate]);

  const handleComplete = (data: any) => {
    console.log("Photoshoot creation completed:", data);
    
    try {
      // Save project to localStorage
      const projectId = id || generateProjectId();
      
      // Optimize images - don't store very large base64 strings
      const images = (data.images || data.generatedImages || []).map((img: string) => {
        // If base64 data URL is too large, truncate or keep only thumbnail
        if (img && img.startsWith('data:') && img.length > 100000) {
          // For very large images, just keep a reference
          return img.substring(0, 500) + '... [truncated]';
        }
        return img;
      });
      
      const project: Project = {
        id: projectId,
        title: data.title || `Photoshoot ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        thumbnail: images[0]?.substring(0, 1000) || undefined, // Truncate thumbnail too
        images: images,
        generatedImages: images,
        // Don't save uploadedFiles as they can be very large
        selectedModels: data.selectedModels || [],
        selectedBackgrounds: data.selectedBackgrounds || [],
        scenarios: data.scenarios,
        metadata: {
          modelIds: data.modelIds,
          zoomLevel: data.zoomLevel,
          rotation: data.rotation,
          position: data.position,
          products: data.products,
        },
      };

      saveProject(project);

      // Navigate to dashboard after completion
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving project:", error);
      if (error.name === 'QuotaExceededError') {
        alert('Lỗi: Bộ nhớ đã đầy! Vui lòng xóa một số projects cũ trong Dashboard hoặc xóa cache trình duyệt.');
      } else {
        alert('Có lỗi xảy ra khi lưu project. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="ml-4 text-muted-foreground">
              Loading project data...
            </p>
          </div>
        ) : (
          <PhotoshootCreator
            onComplete={handleComplete}
            initialData={projectData}
          />
        )}
      </main>
    </div>
  );
}
