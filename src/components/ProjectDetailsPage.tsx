import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProjectById,
  deleteProject,
  formatRelativeTime,
  Project,
} from "@/lib/projectStorage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share, Trash, Edit, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }

    const loadedProject = getProjectById(id);
    if (loadedProject) {
      setProject(loadedProject);
    } else {
      // Project not found, redirect to dashboard
      navigate("/dashboard");
    }
    setIsLoading(false);
  }, [id, navigate]);

  const handleDelete = () => {
    if (!id) return;
    
    const deleted = deleteProject(id);
    if (deleted) {
      setIsDeleteDialogOpen(false);
      navigate("/dashboard");
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log("Duplicating project:", id);
    // For now, just navigate to create page
    navigate("/create");
  };

  const handleDownload = (imageUrl: string) => {
    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform: string) => {
    if (!project) return;
    console.log(`Sharing to ${platform}:`, project.title);
    // In a real app, this would open a share dialog for the specified platform
    alert(`Shared to ${platform} successfully!`);
    setIsShareDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const projectDate = formatRelativeTime(project.date);
  const projectImages = project.generatedImages || project.images || [];

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

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
            <Link to={`/edit/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Edit
              </Button>
            </Link>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your project and all associated images.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <p className="text-muted-foreground">
            Created {projectDate} • {projectImages.length} image{projectImages.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="details">Project Details</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="space-y-6">
                {projectImages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No images in this project yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectImages.map((image, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-0">
                        <img
                          src={image}
                          alt={`${project.title} - Image ${index + 1}`}
                          className="w-full h-[300px] object-cover"
                        />
                      </CardContent>
                      <CardFooter className="flex justify-between p-4">
                        <span className="text-sm font-medium">
                          Image {index + 1}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(image)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Dialog
                            open={isShareDialogOpen}
                            onOpenChange={setIsShareDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Share className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Share Image</DialogTitle>
                                <DialogDescription>
                                  Share this image to your social media
                                  platforms.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4 py-4">
                                <Button
                                  variant="outline"
                                  onClick={() => handleShare("instagram")}
                                >
                                  Instagram
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleShare("facebook")}
                                >
                                  Facebook
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleShare("twitter")}
                                >
                                  Twitter
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleShare("pinterest")}
                                >
                                  Pinterest
                                </Button>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="ghost"
                                  onClick={() => setIsShareDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardFooter>
                    </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Models Used</h3>
                      <p className="text-muted-foreground">
                        {project.selectedModels && project.selectedModels.length > 0
                          ? project.selectedModels.join(", ")
                          : "None"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Backgrounds</h3>
                      <p className="text-muted-foreground">
                        {project.selectedBackgrounds && project.selectedBackgrounds.length > 0
                          ? project.selectedBackgrounds.join(", ")
                          : "None"}
                      </p>
                    </div>
                    {project.scenarios && project.scenarios.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium">Scenarios</h3>
                        <p className="text-muted-foreground">
                          {project.scenarios.map((s: any) => s.theme || "").filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>
                      Track how your photoshoot is performing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold">{projectImages.length}</p>
                        <p className="text-sm text-muted-foreground">Images</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold">
                          {project.selectedModels?.length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Models</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold">
                          {project.scenarios?.length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Scenarios</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => projectImages[0] && handleDownload(projectImages[0])}
                  disabled={projectImages.length === 0}
                >
                  Download All Images
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  Share Project
                </Button>
                <Link to={`/edit/${id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Edit Project
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    <span className="text-muted-foreground">{projectDate}</span>
                  </div>
                  <div>
                    <span className="font-medium">Images:</span>{" "}
                    <span className="text-muted-foreground">{projectImages.length}</span>
                  </div>
                  {project.id && (
                    <div>
                      <span className="font-medium">ID:</span>{" "}
                      <span className="text-muted-foreground font-mono text-xs">{project.id}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
