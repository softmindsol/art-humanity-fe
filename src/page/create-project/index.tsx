// src/pages/CreateProjectPage.tsx
import { useNavigate } from 'react-router-dom';
import CreateProjectForm from '@/components/forms/CreateProjectForm';
import { useProjects } from '../../context/ProjectContext'; // Ab yeh import sahi se kaam karega

const CreateProjectPage = () => {
    const navigate = useNavigate();
    const { addProject } = useProjects(); // Dekhiye, use karna kitna saaf hai

    const handleProjectCreated = (projectData: any) => {
        console.log('Project data received in parent page:', projectData);

        // Project ko global state mein add karein
        const newProject = addProject(projectData);

        // User ko naye project ke canvas page par redirect karein
        navigate(`/project/${newProject.projectId}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto py-10 px-4">
                <CreateProjectForm onProjectCreated={handleProjectCreated} />
            </div>
        </div>
    );
};

export default CreateProjectPage;