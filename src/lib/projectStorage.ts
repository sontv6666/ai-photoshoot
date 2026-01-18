/**
 * Service for managing projects in localStorage
 */

export interface Project {
  id: string;
  title: string;
  date: string; // ISO date string
  thumbnail?: string;
  images: string[];
  uploadedFiles?: any[]; // Store file references if needed
  selectedModels?: string[];
  selectedBackgrounds?: string[];
  generatedImages: string[];
  scenarios?: any[]; // From Gemini generation
  metadata?: {
    modelIds?: string[];
    zoomLevel?: number;
    rotation?: number;
    position?: { x: number; y: number };
    products?: string[];
  };
}

const PROJECTS_STORAGE_KEY = "fashion_ai_projects";
const PROJECT_COUNTER_KEY = "fashion_ai_project_counter";
const MAX_PROJECTS = 50; // Limit number of projects to prevent storage overflow

/**
 * Get all projects from localStorage
 */
export function getAllProjects(): Project[] {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export function getProjectById(id: string): Project | null {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Optimize project data to reduce storage size
 */
function optimizeProject(project: Project): Project {
  const optimized = { ...project };
  
  // Remove large base64 data, keep only URLs or data URLs
  // If images are base64 data URLs, convert them to just URLs if possible
  if (optimized.generatedImages) {
    optimized.generatedImages = optimized.generatedImages.map((img) => {
      // If it's a very long base64 string (> 50KB), truncate or remove
      if (img.startsWith('data:') && img.length > 50000) {
        // Keep only first 1000 chars for reference (thumbnail)
        return img.substring(0, 1000) + '...';
      }
      return img;
    });
  }
  
  // Remove uploadedFiles as they can be very large
  if (optimized.uploadedFiles) {
    optimized.uploadedFiles = undefined;
  }
  
  // Limit metadata size
  if (optimized.metadata) {
    const metadata = { ...optimized.metadata };
    // Remove large data from metadata
    optimized.metadata = metadata;
  }
  
  return optimized;
}

/**
 * Save a project (create or update)
 * Automatically removes old projects if storage limit is exceeded
 */
export function saveProject(project: Project): Project {
  try {
    const projects = getAllProjects();
    const existingIndex = projects.findIndex((p) => p.id === project.id);

    // Optimize project data to reduce size
    const optimizedProject = optimizeProject(project);

    if (existingIndex >= 0) {
      // Update existing project
      projects[existingIndex] = optimizedProject;
    } else {
      // Add new project
      projects.unshift(optimizedProject); // Add to beginning
      
      // If we exceed max projects, remove oldest ones
      if (projects.length > MAX_PROJECTS) {
        // Sort by date (newest first) and keep only MAX_PROJECTS
        projects.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first
        });
        
        // Remove oldest projects
        while (projects.length > MAX_PROJECTS) {
          projects.pop();
        }
      }
    }

    // Try to save, handle quota exceeded error
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded. Attempting to free up space...');
        
        // Try to free up space by removing oldest projects
        const sortedProjects = [...projects].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB; // Oldest first
        });
        
        // Remove oldest 10% of projects
        const removeCount = Math.max(1, Math.floor(sortedProjects.length * 0.1));
        const toRemove = sortedProjects.slice(0, removeCount).map(p => p.id);
        const filteredProjects = projects.filter(p => !toRemove.includes(p.id));
        
        try {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filteredProjects));
          console.log(`Removed ${removeCount} old projects to free up space`);
          
          // Retry saving the current project
          const newProjects = getAllProjects();
          const newExistingIndex = newProjects.findIndex((p) => p.id === optimizedProject.id);
          if (newExistingIndex >= 0) {
            newProjects[newExistingIndex] = optimizedProject;
          } else {
            newProjects.unshift(optimizedProject);
          }
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newProjects));
        } catch (retryError) {
          // If still failing, clear all and save only this project
          console.error('Still out of space after cleanup. Clearing all projects and saving only current one.');
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([optimizedProject]));
        }
      } else {
        throw error;
      }
    }
    
    return optimizedProject;
  } catch (error: any) {
    console.error('Error saving project:', error);
    // Show user-friendly error message
    if (error.name === 'QuotaExceededError') {
      alert('Storage đã đầy! Vui lòng xóa một số projects cũ hoặc xóa cache trình duyệt.');
    }
    throw error;
  }
}

/**
 * Delete a project by ID
 */
export function deleteProject(id: string): boolean {
  const projects = getAllProjects();
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) {
    return false; // Project not found
  }

  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Generate a new unique project ID
 */
export function generateProjectId(): string {
  const counter = parseInt(
    localStorage.getItem(PROJECT_COUNTER_KEY) || "0",
    10,
  );
  const newCounter = counter + 1;
  localStorage.setItem(PROJECT_COUNTER_KEY, newCounter.toString());
  return `project-${Date.now()}-${newCounter}`;
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
}

/**
 * Get project stats
 */
export function getProjectStats(): {
  totalPhotoshoots: number;
  totalImages: number;
} {
  const projects = getAllProjects();
  const totalImages = projects.reduce(
    (sum, project) => sum + (project.generatedImages?.length || 0),
    0,
  );

  return {
    totalPhotoshoots: projects.length,
    totalImages,
  };
}

/**
 * Clear old projects to free up space
 * Keeps only the N most recent projects
 */
export function clearOldProjects(keepCount: number = MAX_PROJECTS): number {
  const projects = getAllProjects();
  if (projects.length <= keepCount) {
    return 0; // No projects to remove
  }

  // Sort by date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });

  // Keep only the most recent ones
  const toKeep = sortedProjects.slice(0, keepCount);
  const removedCount = projects.length - toKeep.length;

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(toKeep));
    return removedCount;
  } catch (error) {
    console.error('Error clearing old projects:', error);
    return 0;
  }
}

/**
 * Estimate storage usage for projects
 */
export function estimateStorageUsage(): {
  sizeInMB: number;
  sizeInKB: number;
  projectsCount: number;
} {
  try {
    const projects = getAllProjects();
    const data = JSON.stringify(projects);
    const sizeInBytes = new Blob([data]).size;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;

    return {
      sizeInMB: Math.round(sizeInMB * 100) / 100,
      sizeInKB: Math.round(sizeInKB * 100) / 100,
      projectsCount: projects.length,
    };
  } catch (error) {
    console.error('Error estimating storage:', error);
    return { sizeInMB: 0, sizeInKB: 0, projectsCount: 0 };
  }
}
