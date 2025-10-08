import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectAllProjects,
    selectProjectsLoading,
    selectProjectsError,
    selectProjectPagination,
    removeProjectFromList,

} from '@/redux/slice/project';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject, fetchActiveProjects, updateProjectStatus } from '@/redux/action/project';
import { getImageUrl } from '@/utils/publicUrl';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trash2, CheckCircle } from 'lucide-react'; // Icons
import { useDebounce } from '@/hook/useDebounce';
import { SearchBar } from '@/components/common/SearchBar';
import { ProjectStatusFilter } from '@/components/common/ProjectStatusFilter';
import { Pagination } from '@/components/common/Pagination';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';
import ProjectTitle from '@/components/common/ProjectTitle';

const ActiveProjects: React.FC = () => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();

    const projects = useSelector(selectAllProjects);
    const isLoading = useSelector(selectProjectsLoading).fetching;
    const { totalPages } = useSelector(selectProjectPagination);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { socket } = useSocket(); // Get the socket instance from your context

    const [dialogState, setDialogState] = useState<any>({
        isOpen: false,
        projectId: null,
        actionType: null, // 'PAUSE', 'CLOSE', ya 'DELETE'
        actionText: '',
    });
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms ka delay
    const error = useSelector(selectProjectsError).fetching;

    // --- Data Fetch Karne ke liye Master useEffect ---
    useEffect(() => {
        // Jab bhi page, filter, ya (debounced) search term badlega, yeh effect chalega
        // inside useEffect that fetches
        dispatch(fetchActiveProjects({
            page: currentPage,
            limit: 6,                // keep consistent
            status: statusFilter,
            search: debouncedSearchTerm
        }));
    }, [currentPage, statusFilter, debouncedSearchTerm, dispatch]);



    // Naya handler jo sirf dialog ko kholega
    const openConfirmationDialog = (projectId: string, actionType: string, actionText: string) => {
        setDialogState({
            isOpen: true,
            projectId,
            actionType,
            actionText,
        });
    };

    // Asal action ko anjaam dene wala handler
    const handleConfirmAction = () => {
        const { projectId, actionType } = dialogState;
        if (!projectId || !actionType) return;

        // --- YAHAN PAR FIX HAI: Naye status field ke mutabiq actions ---
        if (actionType === 'PAUSE') {
            dispatch(updateProjectStatus({ projectId, status: 'Paused' }));
        } else if (actionType === 'RESUME') {
            dispatch(updateProjectStatus({ projectId, status: 'Active' }));
        } else if (actionType === 'COMPLETE') { // 'CLOSE' ke bajaye 'COMPLETE'

            dispatch(updateProjectStatus({ projectId, status: 'Completed' }));
        } else if (actionType === 'DELETE') {
            dispatch(deleteProject(projectId));
        }

        setDialogState({ isOpen: false, projectId: null, actionType: null, actionText: '' });
    };

    // --- REAL-TIME LISTENER FOR DELETED PROJECTS ---
    useEffect(() => {
        if (!socket) {
            console.log("[Socket] No socket instance available yet. Waiting...");
            return;
        }


        const handleProjectDeleted = (data: { projectId: string, message: string }) => {
            dispatch(removeProjectFromList({ projectId: data.projectId }));
            toast.error(data.message);
        };
        socket.on('project_deleted', handleProjectDeleted);

        // This `return` function is the CLEANUP function.
        // React runs this when the component unmounts. This is the ONLY correct place for `socket.off`.
        return () => {
            socket.off('project_deleted', handleProjectDeleted);
        };
    }, [socket, dispatch]); // Dependencies are correct



    return (
        <div id="projects-content" className="projects-content">
            <section className="projects-header page-header">
                <h2>Active Projects</h2>
                <p style={{ color: '#8d6e63' }}>Enter a project, or sign up to contribute!</p>
            </section>

            {/* "Create Project" button ab "/admin/dashboard" par link karega */}
            {user?.role === 'admin' && (
                <section className='flex items-center justify-center my-6'>
                    <Link to="/create-project">
                        <Button className="bg-[#d29000] cursor-pointer hover:bg-[#b38f2c] text-white font-bold py-2 px-4 rounded shadow-lg !border !border-[#5d4037]">
                            Create a New Project
                        </Button>
                    </Link>
                </section>
            )}

            {/* --- Filter aur Search Bar --- */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 w-full ">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <ProjectStatusFilter statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            </div>
            {

                isLoading ? (
                    // Agar loading ho rahi hai, to yahan loader dikhayein
                    <div className="flex justify-center items-center w-full py-20" >
                        <div className="w-16 h-16 border-4 border-[#d29000] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    // Agar error hai, to yahan error message dikhayein
                    <div className="text-center py-20 text-red-600  p-4 rounded-lg">
                        <h3 className="font-bold">Oops! Something went wrong.</h3>
                        <p>{error}</p>
                    </div>
                ) :

                    <section className="projects-grid mt-5">
                        {
                            projects.length === 0 ? (
                                <div className="text-center w-full py-20 col-span-full">
                                    <h3 className="text-2xl !text-[#5d4037]">No projects found.</h3>
                                    {user?.role === 'admin' && <p className="!text-[#5d4037]">You can create the first one from the Admin Dashboard.</p>}
                                </div>
                            ) : (
                                projects.map((project: any) => {
                                    const isProjectPaused = project.status === 'Paused';

                                    return (
                                        <div key={project._id} className="project-card active">
                                            <div className="project-image relatve">
                                                <img
                                                    src={getImageUrl(project.thumbnailUrl) || 'https://via.placeholder.com/400x250'}
                                                    alt={project.title}
                                                />
                                                {/* Project status badge */}
                                                <div className="absolute top-2 right-2">
                                                    <Badge
                                                        // We will no longer use the generic 'variant' prop.
                                                        // Instead, we'll use a template literal for dynamic, high-contrast classes.
                                                        className={`text-sm font-semibold shadow-md
                                                        ${
                                                            // Pehla check: Kya status 'Paused' hai?
                                                            project.status === 'Paused'
                                                                ? 'bg-red-600 text-white border-red-700' // Haan, to Red (laal)
                                                                // Agar nahi, to doosra check: Kya status 'Completed' hai?
                                                                : project.status === 'Completed'
                                                                    ? 'bg-purple-600 text-white border-purple-700' // Haan, to Purple (jamni)
                                                                    // Agar woh bhi nahi (matlab 'Active' hai)
                                                                    : 'bg-green-600 text-white border-green-700' // To Green (sabz)
                                                            }
                                                                `}
                                                    >
                                                        {project.status}
                                                    </Badge>
                                                </div>
                                                <div className="project-progress">
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${project.stats?.percentComplete || 0}%` }}></div>
                                                    </div>
                                                    <div className="progress-text">{project.stats?.percentComplete?.toFixed(2) || 0}% Complete</div>
                                                </div>
                                            </div>
                                            <div className="project-info">
                                                <ProjectTitle project={project} isAdmin={user?.role === 'admin'} />
                                                <div className="project-stats">
                                                    <div className="stat">
                                                        <span className="stat-value !text-[#8d6e63] !text-[12.8px]">{project.contributors?.length || 0}</span>
                                                        <span className="stat-label !text-[#8d6e63]">Contributors</span>
                                                    </div>
                                                    <div className="stat">
                                                        <span className="stat-value !text-[#8d6e63] !text-[12.8px]">{project.stats?.pixelCount || 0}</span>
                                                        <span className="stat-label !text-[#8d6e63]">Pixels Painted</span>
                                                    </div>
                                                </div>
                                                {project.status === 'Completed' ? (
                                                    // --- AGAR PROJECT COMPLETED HAI ---
                                                    <Link
                                                        to={`/project/${project?.canvasId}?view=gallery`}
                                                        className="btn-contribute !text-white !bg-purple-600 hover:!bg-purple-700" // Gallery wala style
                                                        title="View this completed artwork in the gallery"
                                                    >
                                                        View Artwork
                                                    </Link>
                                                ) : (<Link
                                                    // Step 1: Agar project paused hai, to usay kahin bhi na le kar jao
                                                    to={isProjectPaused ? "#" : `/project/${project?.canvasId}`}

                                                    // Step 2: Kuch aisi CSS classes lagayein jo disabled jaisa look dein
                                                    className={`btn-contribute !text-black !bg-[#d4af37] ${isProjectPaused ? 'opacity-50 cursor-not-allowed' : 'hover:!bg-[#b38f2c]'}`}

                                                    // Step 3: Event ko cancel karein taake link kaam na kare
                                                    onClick={(e) => { if (isProjectPaused) e.preventDefault(); }}

                                                    // title se user ko wajah batayein
                                                    title={isProjectPaused ? "This project is currently paused" : "Enter Project"}
                                                >
                                                    {/* Text bhi badalna ek acha option hai */}
                                                    {isProjectPaused ? "Project Paused" : "Enter Project"}
                                                </Link>)}
                                                {/* // -------- YEH MUKAMMAL UPDATE SHUDA JSX HAI -------- */}

                                                {user?.role === 'admin' && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <div className="flex items-center justify-between">
                                                            {/* --- ADMIN ACTIONS AB NAYE STATUS FIELD PAR CHALENGE --- */}
                                                            {project.status === 'Paused' ? (
                                                                <Button
                                                                    className="cursor-pointer"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="Resume Project"
                                                                    onClick={() =>
                                                                        // Naya Function Signature: (projectId, actionType, actionText)
                                                                        openConfirmationDialog(project._id, 'RESUME', 'Resume')
                                                                    }
                                                                >
                                                                    <Play className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    className="cursor-pointer"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="Pause Project"
                                                                    onClick={() =>
                                                                        // Naya Function Signature: (projectId, actionType, actionText)
                                                                        openConfirmationDialog(project._id, 'PAUSE', 'Pause')
                                                                    }
                                                                >
                                                                    <Pause className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            <Button className="cursor-pointer bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Close Project (Move to Gallery)" onClick={() => openConfirmationDialog(project._id, 'COMPLETE', 'Mark as Complete')}>
                                                                <CheckCircle className="h-4 w-4 cursor-pointer" />
                                                            </Button>

                                                            <Button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                                                                variant="destructive"
                                                                size="icon"
                                                                title="Delete Project FOREVER" onClick={() => openConfirmationDialog(project._id, 'DELETE', 'DELETE PERMANENTLY')}>
                                                                <Trash2 className="h-4 w-4 cursor-pointer" color='white' />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                    </section>}

            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
            <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState({ ...dialogState, isOpen })}>
                <AlertDialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className='!text-white'>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will <span className="font-bold">{dialogState.actionText}</span> this project. This may affect active contributors.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='cursor-pointer '>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50" onClick={handleConfirmAction}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ActiveProjects;