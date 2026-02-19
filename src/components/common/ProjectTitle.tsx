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
            <div className="w-full p-[1px] rounded bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="text-[18px] font-semibold text-white w-full px-2 py-1 bg-[#1A1A1A] rounded outline-none placeholder:text-gray-500"
                    autoFocus
                    disabled={isLoading}
                    maxLength={20}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 group">
            <h3 className='!text-[#ffffff] text-[18px] font-semibold'>{project.title}</h3>
            {isAdmin && (
                <div className="p-[1px] rounded-[6px] bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#1A1A1A] w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#252525] transition-colors"
                        title="Edit Title"
                    >
                        <Edit2 size={14} className="text-white" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectTitle;