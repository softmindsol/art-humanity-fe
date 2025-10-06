import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { updateProjectTitle } from '@/redux/action/project';
import { toast } from 'sonner';
import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';

interface ProjectTitleProps {
    project: any;
    isAdmin: boolean;
}

const ProjectTitle: React.FC<ProjectTitleProps> = ({ project, isAdmin }) => {
    const dispatch = useAppDispatch();
    const { user } = useAuth()
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(project.title);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTitle(project.title); // Jab prop se title badle, to state update karein
    }, [project.title]);

    const handleSave = async () => {
        if (title.trim() === '' || title === project.title) {
            setIsEditing(false);
            setTitle(project.title); // Ghalat input ko revert karein
            return;
        }

        setIsLoading(true);
        try {
            await dispatch(updateProjectTitle({ projectId: project._id, title, userId: user?._id })).unwrap();
            toast.success("Project title updated!");
            setIsEditing(false);
        } catch (err: any) {
            toast.error(`Failed to update title: ${err}`);
            setTitle(project.title); // Error par revert karein
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave} // Jab input se focus hatay, to save karein
                onKeyDown={(e) => e.key === 'Enter' && handleSave()} // Enter dabane par save karein
                className="text-xl font-bold text-gray-800 w-full p-1 border rounded"
                autoFocus
                disabled={isLoading}
            />
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <h3 className='!text-[#5d4037]'>{project.title}</h3>
            {isAdmin && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Title"
                >
                    <Edit2 size={16} className="text-gray-500" />
                </button>
            )}
        </div>
    );
};

export default ProjectTitle;