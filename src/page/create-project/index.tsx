import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CreateProjectForm from '@/components/forms/CreateProjectForm';
import { createProject } from '@/redux/action/project'; // Sahi action import karein
import { selectProjectsLoading, selectProjectsError } from '@/redux/slice/project'; // Sahi slice se selectors import karein
import type { AppDispatch, RootState } from '@/redux/store';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreateProjectPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const generateCanvasId = () => `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Step 1: User ko Redux store se nikalein (Aapne yeh bilkul sahi kiya hai)
    const user = useSelector((state: RootState) => state?.auth?.user);

    // Loading aur error states
    const isLoading = useSelector(selectProjectsLoading).creating;
    const error = useSelector(selectProjectsError).creating;

    const handleProjectCreated = async (formData: FormData) => {
        if (!user?.id) {
            console.error("User not logged in");
            return;
        }

        // Step 1: Ek unique canvas ID generate karein
        const newCanvasId = generateCanvasId();

        // Append userId into same FormData
        formData.append("userId", user.id);
        // Append canvasId into same FormData
        formData.append("canvasId", newCanvasId);
        try {
            const resultAction = await dispatch(createProject(formData));

            if (resultAction.type.endsWith('/fulfilled')) {
                navigate(`/projects`);
            } else {
                throw new Error(resultAction.payload || 'Failed to create project');
            }
        } catch (err: any) {
            console.error("Failed to create project:", err.message);
        }
    };


    return (
        <div className="min-h-screen">
            <Button
                type="button"
                onClick={() => navigate(-1)} // or: navigate('/projects')
                className="absolute left-10 top-20 sm:top-36 inline-flex items-center gap-2
                   rounded-xl border border-gray-200 bg-white/80 backdrop-blur
                   px-3 py-2 text-[#5d4037] hover:text-[#3e2723] shadow-sm hover:shadow
                   transition cursor-pointer"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline ">Back</span>
            </Button>
            <div className="max-w-4xl mx-auto px-4">
                <CreateProjectForm
                    onProjectCreated={handleProjectCreated}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default CreateProjectPage;