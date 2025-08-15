// src/pages/TiledCanvasPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TiledCanvas from '@/components/common/KonvaCanvas';
import type { AppDispatch } from '@/redux/store';
import { fetchProjectById } from '@/redux/action/project';
import { selectCurrentProject, selectProjectsLoading, selectProjectsError, clearCurrentProject } from '@/redux/slice/project';
import ProjectPage from '../projectPage';

const TiledCanvasPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const project = useSelector(selectCurrentProject);
    const loading = useSelector(selectProjectsLoading).fetchingById;
    const error = useSelector(selectProjectsError).fetchingById;

    useEffect(() => {
        if (projectId) dispatch(fetchProjectById(projectId));
        return () => { dispatch(clearCurrentProject()); }; // cleanup on unmount
    }, [projectId, dispatch]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center mt-14">
                <h2 className="text-2xl mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
                <Button className="mt-6" onClick={() => navigate('/projects')}>Go back to Project List</Button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center mt-14">
                <h2 className="text-2xl">Project not found!</h2>
                <Button className="mt-6" onClick={() => navigate('/projects')}>Go back to Project List</Button>
            </div>
        );
    }

    return (
        <div>
            <Button
                type="button"
                onClick={() => {navigate(-1)}} // or: navigate('/projects')
                className="absolute left-10 top-20 sm:top-36 inline-flex items-center gap-2
                   rounded-xl border border-gray-200 bg-white/80 backdrop-blur
                   px-3 py-2 text-[#5d4037] hover:text-[#3e2723] shadow-sm hover:shadow
                   transition"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
            </Button>

            {/* Canvas ko project se size/dimensions do (agar fields hain) */}
            <ProjectPage
               projectName={project.title}
               canvasId={project.canvasId}
                projectId={project._id}
            
            />
        </div>
    );
};

export default TiledCanvasPage;
