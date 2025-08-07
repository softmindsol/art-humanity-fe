// src/context/ProjectContext.tsx
import  { createContext, useState, useContext } from 'react';

// Project ka data structure
interface Project {
    projectId: string; // Form se aayi hui ID
    canvasId: string; // Form se aayi hui ID
    title: string;
    description: string;
    width: number;
    height: number;
    palette: string;
    colorPalette: string[];
    thumbnailUrl: string;
    baseImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// Context ka data structure
interface ProjectContextType {
    projects: Project[];
    addProject: (project: Omit<Project, 'updatedAt'>) => Project; // Naya project add karne ka function
    getProjectById: (id: string) => Project | undefined;
}

// Context create karein
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider component
export const ProjectProvider = ({ children }: { children: any }) => {
    const [projects, setProjects] = useState<Project[]>([]);

    const addProject = (projectData: Omit<Project, 'updatedAt'>): Project => {
        const newProject: Project = {
            ...projectData,
            updatedAt: new Date().toISOString(),
        };
        setProjects(prev => {
            const updatedProjects = [...prev, newProject];
            console.log("Global project list updated:", updatedProjects);
            return updatedProjects;
        });
        return newProject;
    };

    const getProjectById = (id: string): Project | undefined => {
        return projects.find(p => p.projectId === id);
    };

    return (
        <ProjectContext.Provider value={{ projects, addProject, getProjectById }}>
            {children}
        </ProjectContext.Provider>
    );
};

// ====================================================================
// YEH HAI AAPKA CUSTOM HOOK (THIS IS YOUR CUSTOM HOOK)
// ====================================================================
export const useProjects = () => {
    const context = useContext(ProjectContext);

    // Yahan error check ho raha hai
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }

    return context;
};