import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CreateProjectForm from '@/components/forms/CreateProjectForm';
import { createProject } from '@/redux/action/project'; // Sahi action import karein
import { selectProjectsLoading, selectProjectsError } from '@/redux/slice/project'; // Sahi slice se selectors import karein
import type { AppDispatch, RootState } from '@/redux/store';

const CreateProjectPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    // Step 1: User ko Redux store se nikalein (Aapne yeh bilkul sahi kiya hai)
    const user = useSelector((state: RootState) => state.auth.user);

    // Loading aur error states
    const isLoading = useSelector(selectProjectsLoading).creating;
    const error = useSelector(selectProjectsError).creating;

    const handleProjectCreated = async (projectDataFromForm: any) => {
        // Guard Clause: Agar user login nahi hai to aage na badhein
        if (!user?.id) {
            console.error("User not found or not logged in. Cannot create project.");
            // Aap yahan ek error message bhi dikha sakte hain
            return;
        }

        // Step 2: Form se aaye hue data mein `userId` ko shamil karein
        const completePayload = {
            ...projectDataFromForm,
            userId: user?.id, // Backend isko `ownerId` ke taur par use karega
        };

        console.log('Dispatching createProject with complete payload:', completePayload);

        try {
            // Step 3: Sahi data structure ke saath thunk ko dispatch karein
            const resultAction = await dispatch(createProject(completePayload));

            const newProject = resultAction.payload;
            console.log(resultAction)
            // Check karein ke project a successful response hai ya nahi
            if (newProject && resultAction.type.endsWith('/fulfilled')) {
                console.log("Project created successfully:", newProject);
                // Naye project ke canvas page par redirect karein
                // **IMPORTANT**: Route ko `/canvas` ya `/project` rakhein, jaisa aapne router mein set kiya hai
                // navigate(`/canvas/${newProject._id}`);
                navigate(`/projects`);
            } else {
                // Agar thunk reject ho, to error yahan aayega
                throw new Error(resultAction.payload || 'Failed to create project');
            }

        } catch (err: any) {
            console.error("Failed to create project:", err.message);
            // Error Redux slice mein pehle se he set ho jayega, yahan extra kuch karne ki zaroorat nahi.
        }
    };

    return (
        <div className="min-h-screen">
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