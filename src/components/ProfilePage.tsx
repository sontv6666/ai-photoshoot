import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { getAllProjects, formatRelativeTime, getProjectStats } from "@/lib/projectStorage";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  company: string;
  joinedDate: string;
  projectsCount: number;
}

export default function ProfilePage() {
  const [projectsCount, setProjectsCount] = useState(0);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    // Load user profile from localStorage (can be extended later)
    const stats = getProjectStats();
    setProjectsCount(stats.totalPhotoshoots);

    // Load recent projects
    const allProjects = getAllProjects();
    const recent = allProjects.slice(0, 3).map((project) => ({
      id: project.id,
      title: project.title || "Untitled Project",
      date: formatRelativeTime(project.date),
      imagesCount: project.generatedImages?.length || 0,
    }));
    setRecentProjects(recent);
  }, []);

  // User profile - stored in localStorage or default
  const getUserProfile = (): UserProfile => {
    const stored = localStorage.getItem("user_profile");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to default
      }
    }
    // Default user profile
    return {
      id: "user-123",
      name: "User",
      email: "user@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
      role: "Fashion Designer",
      company: "Your Company",
      joinedDate: new Date().toLocaleDateString(),
      projectsCount,
    };
  };

  const user = getUserProfile();
  user.projectsCount = projectsCount; // Update with real count

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl bg-background">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="rounded-full w-32 h-32 border-4 border-primary/20"
              />
            </div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.role}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{user.company}</p>
            <p className="text-sm">Member since {user.joinedDate}</p>
            <p className="text-sm">{user.projectsCount} projects created</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </CardFooter>
        </Card>

        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Full Name
                </h3>
                <p>{user.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email
                </h3>
                <p>{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Role
                </h3>
                <p>{user.role}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Company
                </h3>
                <p>{user.company}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="mr-2">Update Information</Button>
            <Button variant="outline">Change Password</Button>
          </CardFooter>
        </Card>

        {/* Recent Activity Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent photoshoots and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No projects yet. Create your first photoshoot!</p>
                <Link to="/create" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Create Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center p-3 border rounded-md"
                  >
                    <div className="w-12 h-12 bg-secondary rounded-md flex items-center justify-center mr-4">
                      <span className="text-secondary-foreground text-xs">
                        📸
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.date} • {project.imagesCount} image{project.imagesCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link to={`/project/${project.id}`}>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {recentProjects.length > 0 && (
              <Link to="/dashboard" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Projects
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
