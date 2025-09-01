import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectAllProjects,
    selectProjectsLoading,
    selectProjectsError,
    selectProjectPagination
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
import { fetchActiveProjects, updateProjectStatus } from '@/redux/action/project';
import { getImageUrl } from '@/utils/publicUrl';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, XCircle } from 'lucide-react'; // Icons
import { useDebounce } from '@/hook/useDebounce';
import { SearchBar } from '@/components/common/SearchBar';
import { ProjectStatusFilter } from '@/components/common/ProjectStatusFilter';
import { Pagination } from '@/components/common/Pagination';

const ActiveProjects: React.FC = () => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();

    const projects = useSelector(selectAllProjects);
    const isLoading = useSelector(selectProjectsLoading).fetching;
    const {  totalPages } = useSelector(selectProjectPagination);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [dialogState, setDialogState] = useState<any>({
        isOpen: false,
        projectId: null,
        statusUpdate: null,
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
            limit: 9,                // keep consistent
            status: statusFilter,
            search: debouncedSearchTerm
        }));
    }, [currentPage, statusFilter, debouncedSearchTerm, dispatch]);   
 
 

    // Naya handler jo sirf dialog ko kholega
    const openConfirmationDialog = (projectId: string, statusUpdate: object, actionText: string) => {
        setDialogState({
            isOpen: true,
            projectId,
            statusUpdate,
            actionText,
        });
    };

    // Asal action ko anjaam dene wala handler
    const handleConfirmAction = () => {
        if (dialogState.projectId && dialogState.statusUpdate) {
            dispatch(updateProjectStatus({
                projectId: dialogState.projectId,
                statusUpdate: dialogState.statusUpdate,
            }));
            // inside useEffect that fetches
            dispatch(fetchActiveProjects({
                page: currentPage,
                limit: 9,                // keep consistent
                status: statusFilter,
                search: debouncedSearchTerm
            }));

        }
        // Dialog ko band karein
        setDialogState({ isOpen: false, projectId: null, statusUpdate: null, actionText: '' });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full py-20">
                <div className="w-16 h-16 border-4 border-[#d29000] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold">Oops! Something went wrong.</h3>
                <p>{error}</p>
            </div>
        );
    }

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

            <section className="projects-grid mt-5">
                {projects.length === 0 ? (
                    <div className="text-center w-full py-20 col-span-full">
                        <h3 className="text-2xl !text-[#5d4037]">No active projects found.</h3>
                        {user?.role === 'admin' && <p className="!text-[#5d4037]">You can create the first one from the Admin Dashboard.</p>}
                    </div>
                ) : (
                    projects.map((project: any) => {
                        const isProjectPaused = project.isPaused;

                        return (
                            <div key={project._id} className="project-card active">
                                <div className="project-image relative">
                                    <img
                                        src={getImageUrl(project.thumbnailUrl) || 'https://via.placeholder.com/400x250'}
                                        alt={project.title}
                                    />
                                    {/* Project status badge */}
                                    {project.isPaused && (
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="destructive" className="text-sm">Paused</Badge>
                                        </div>
                                    )}
                                    <div className="project-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${project.stats?.percentComplete || 0}%` }}></div>
                                        </div>
                                        <div className="progress-text">{project.stats?.percentComplete?.toFixed(2) || 0}% Complete</div>
                                    </div>
                                </div>
                                <div className="project-info">
                                    <h3 className='!text-[#5d4037]'>{project.title}</h3>
                                    <div className="project-stats">
                                        <div className="stat">
                                            <span className="stat-value !text-[#8d6e63] !text-[12.8px]">{project.stats?.contributorCount || 0}</span>
                                            <span className="stat-label !text-[#8d6e63]">Contributors</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value !text-[#8d6e63] !text-[12.8px]">{project.stats?.pixelCount || 0}</span>
                                            <span className="stat-label !text-[#8d6e63]">Pixels Painted</span>
                                        </div>
                                    </div>
                                    <Link
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
                                    </Link>
                                    {/* --- ADMIN ACTION BUTTONS --- */}
                                    {user?.role === 'admin' && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 ">
                                            <div className="flex items-center justify-between space-x-2">
                                                <p className="text-xs !text-[#8d6e63]  !p-0 !m-0">Admin Actions:</p>

                                                <div className="flex items-center space-x-2">
                                                    {project.isPaused ? (
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="outline"
                                                            size="icon"
                                                            title="Resume Project"
                                                            onClick={() =>
                                                                openConfirmationDialog(project._id, { isPaused: false }, 'Resume')
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
                                                                openConfirmationDialog(project._id, { isPaused: true }, 'Pause')
                                                            }
                                                        >
                                                            <Pause className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        className="cursor-pointer bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Close Project"
                                                        onClick={() =>
                                                            openConfirmationDialog(project._id, { isClosed: true }, 'Close')
                                                        }
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )
                    })
                )}
            </section>

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