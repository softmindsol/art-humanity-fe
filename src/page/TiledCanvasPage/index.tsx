// src/pages/TiledCanvasPage.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchProjectById } from '@/redux/action/project';
import { selectCurrentProject, selectProjectsLoading, selectProjectsError, clearCurrentProject } from '@/redux/slice/project';
import ProjectPage from '../projectPage';
import useAppDispatch from '@/hook/useDispatch';

const TiledCanvasPage: React.FC = () => {
    const { canvasId } = useParams<{ canvasId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const project = useSelector(selectCurrentProject);
    const  loading = useSelector(selectProjectsLoading).fetchingById;
    const error = useSelector(selectProjectsError).fetchingById;

    useEffect(() => {
        if (canvasId) dispatch(fetchProjectById(canvasId));
        return () => { dispatch(clearCurrentProject()); }; // cleanup on unmount
    }, [canvasId, dispatch]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-14 h-14 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-red-600 mb-2">Something went wrong</h2>
                <p className="mb-6 text-gray-600">{error}</p>
                <Button
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                    onClick={() => navigate('/projects')}
                >
                    Back to Project List
                </Button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Project not found</h2>
                <p className="mb-6 text-gray-500">The project you're looking for doesn't exist.</p>
                <Button
                    className="bg-yellow-600 text-white hover:bg-yellow-700"
                    onClick={() => navigate('/projects')}
                >
                    Back to Project List
                </Button>
            </div>
        );
    }
    return (
        <div>
            <Button
                type="button"
                onClick={() => {navigate(-1)}} // or: navigate('/projects')
                className="absolute z-30 left-10 hidden  xl:top-36 xl:inline-flex items-center gap-2
                   rounded-xl border border-gray-200 bg-white/80 backdrop-blur
                   px-3 py-2 text-[#5d4037] hover:text-[#3e2723] shadow-sm hover:shadow
                   transition cursor-pointer"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5" />
                
            </Button>

            {/* Canvas ko project se size/dimensions do (agar fields hain) */}
            <ProjectPage
               projectName={project.title}
               canvasId={project.canvasId}
                projectId={project._id}
                totalContributors={project.contributors.length}
            />
        </div>
    );
};

export default TiledCanvasPage;
