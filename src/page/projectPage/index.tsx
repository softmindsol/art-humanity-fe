// src/pages/ProjectPage.js

import Toolbox from '@/components/toolbox/Toolbox';
import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from 'react';
import KonvaCanvas from '../../components/common/KonvaCanvas';
import { Film } from 'lucide-react'; // Grid icon imported

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCanvasState } from '@/hook/useCanvasState';
import { clearCanvas, fetchContributionsByTiles, generateTimelapseVideo, getContributionsByProject } from '@/redux/action/contribution';
import InfoBox from '@/components/toolbox/InfoBox';
import { clearAllContributionsFromState, clearCanvasData, clearTimelapseUrl, removeContributionFromState, removeContributionOptimistically, removeMultipleContributionsFromState, selectCanvasData, selectErrorForOperation, selectIsLoadingOperation, selectTimelapseUrl, updateContributionInState } from '@/redux/slice/contribution';
import ContributionSidebar from '@/components/canvas/ContributionSidebar';
import { joinProject } from '@/redux/action/project';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';
import { openAuthModal } from '@/redux/slice/opeModal';
import { io } from 'socket.io-client'; // Socket client import karein
import { addContributionFromSocket } from '@/redux/slice/contribution'; // Naya action import karein
import { useSelector } from 'react-redux';
import { addContributorToState, removeContributorFromState, selectCurrentProject, updateProjectStatusInState } from '@/redux/slice/project';
import type { RootState } from '@/redux/store';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hook/useDebounce';


const TILE_SIZE = 512; // Optimal tile size for performance

interface CursorData {
    position: {
        x: number;
        y: number;
    };
    user?: {
        name?: string;
        color?: string;
    };
}
const ProjectPage = ({ projectName, projectId, totalContributors }: any) => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    // --- STATES ---
    const [socket, setSocket] = useState<any>(null);
    const [canvasStats, setCanvasStats] = useState({
        zoom: 1,
        worldPos: { x: 0, y: 0 },
    });
    console.log(user)
    const debouncedCanvasStats = useDebounce(canvasStats, 300); // Debounce panning/zooming
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isContributionSaving, setIsContributionSaving] = useState(false);
    const [selectedContributionId, setSelectedContributionId] = useState(null);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [loginDialogDismissed, setLoginDialogDismissed] = useState(false);
    const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
    const [isGeneratingTimelapse, _] = useState(false);
    const [isTimelapseFullscreen, setIsTimelapseFullscreen] = useState(false);

    // --- REFS ---
    const canvasContainerRef = useRef<any>(null);
    const listItemRefs = useRef<any>({});
    const [cursors, setCursors] = useState<Record<string, any>>({});
    const mainContentRef = useRef<HTMLDivElement>(null);
    const loadedTilesRef = useRef(new Set()); // Keep track of loaded tiles

    // --- REDUX SELECTORS ---
    const currentProject = useSelector(selectCurrentProject);
    const contributions = useSelector(selectCanvasData);
    const { loading } = useSelector((state: RootState) => state.projects);
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const isGenerating = useSelector(selectIsLoadingOperation('generateTimelapse'));
    const generationError = useSelector(selectErrorForOperation('generateTimelapse'));
    const isReadOnly = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'gallery', []);
    const savedStrokes = useSelector(selectCanvasData);
    const isSaving = useSelector(selectIsLoadingOperation("batchCreateContributions"));
    const saveError = useSelector(selectErrorForOperation("batchCreateContributions"));
    const isClearingCanvas = useSelector(selectIsLoadingOperation('clearCanvas'));




    // --- YEH NAYA HANDLER BANAYEIN ---
    const handleClearHighlight = useCallback(() => {
        // Agar pehle se koi cheez selected hai, to usay deselect kar do
        if (selectedContributionId) {
            setSelectedContributionId(null);
        }
    }, [selectedContributionId]); // Dependency array zaroori hai
    const handleGenerateTimelapse = () => {
        if (!projectId) {
            toast.error("Project ID is not available.");
            return;
        }
        setIsTimelapseOpen(true); // Modal kholein
        dispatch(generateTimelapseVideo({ projectId }));
    };

    // Modal band hone par Redux state saaf karein
    const handleModalClose = (isOpen: any) => {
        if (!isOpen) {
            dispatch(clearTimelapseUrl());
            setIsTimelapseFullscreen(false); // Reset fullscreen state when modal closes

        }
        setIsTimelapseOpen(isOpen);
    };


    const {
        tilesRef,
        isClearAlertOpen,
        setIsClearAlertOpen,
    } = useCanvasState();



    // Canvas se click handle karne wala function
    const handleCanvasClick = (contributionId: any) => {
        console.log(`Canvas clicked. Setting selected ID to: ${contributionId}`);
        setSelectedContributionId(contributionId);
    };



    const handleSidebarContributionSelect = useCallback((contributionId: any) => {
        setSelectedContributionId(contributionId);
        // Sidebar pehle se khula hai, usay dobara kholne ki zaroorat nahi
    }, []);


    // --- DYNAMIC VALUES ---
    const totalCanvasPixels = useMemo(() => {
        if (!currentProject?.width || !currentProject?.height) return 1;
        return currentProject.width * currentProject.height;
    }, [currentProject]);


    // --- TILING DATA FETCHING LOGIC ---
    useEffect(() => {
        // Agar project ya canvas ka container tayyar nahi hai, to kuch na karein
        if (!currentProject || !canvasContainerRef.current) return;

        const { width, height } = currentProject;
        const { zoom, worldPos } = debouncedCanvasStats;
        const { offsetWidth, offsetHeight } = canvasContainerRef.current;

        // Screen par nazar anay wale area ki virtual coordinates calculate karein
        const startX = -worldPos.x / zoom;
        const startY = -worldPos.y / zoom;
        const endX = startX + offsetWidth / zoom;
        const endY = startY + offsetHeight / zoom;

        // In coordinates ko tile numbers mein convert karein
        const firstTileX = Math.max(0, Math.floor(startX / TILE_SIZE));
        const firstTileY = Math.max(0, Math.floor(startY / TILE_SIZE));
        const lastTileX = Math.min(Math.ceil(width / TILE_SIZE) - 1, Math.floor(endX / TILE_SIZE));
        const lastTileY = Math.min(Math.ceil(height / TILE_SIZE) - 1, Math.floor(endY / TILE_SIZE));

        const tilesToLoad = [];
        // Loop chala kar un tamam tiles ki list banayein jo load karne hain
        for (let y = firstTileY; y <= lastTileY; y++) {
            for (let x = firstTileX; x <= lastTileX; x++) {
                const tileId = `${x}-${y}`;
                // Sirf un tiles ko load karein jo pehle se load nahi hue
                if (!loadedTilesRef.current.has(tileId)) {
                    tilesToLoad.push(tileId);
                }
            }
        }

        // Agar load karne ke liye naye tiles hain, to hi API call karein
        if (tilesToLoad.length > 0) {
            console.log("Fetching data for new tiles:", tilesToLoad.join(','));
            // Naye tiles ko "loaded" mark kar dein taake dobara na mangwaye ja sakein
            tilesToLoad.forEach(tileId => loadedTilesRef.current.add(tileId));
            // Sahi format mein API call dispatch karein
            dispatch(fetchContributionsByTiles({ projectId, tiles: tilesToLoad.join(',') }));
        }
    }, [debouncedCanvasStats, currentProject, projectId, dispatch]);

    // Project badalne par purana data saaf karein
    useEffect(() => {
        return () => {
            dispatch(clearAllContributionsFromState()); // Redux mein ek naya reducer
            loadedTilesRef.current.clear();
        };
    }, [projectId, dispatch]);


    const handleClearCanvas = () => {
        dispatch(clearCanvas({ projectId }));
        tilesRef.current.forEach((tile: any) => {
            tile.context.fillStyle = '#ffffff';
            tile.context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.isDirty = true;
        });


    };
    // --- NEW HANDLERS to pass down as props ---

    const handleContributionHover = useCallback((contribution: any, pos: any) => {
        const artistName = contribution.userId?.fullName || ' Artist';
        setTooltip({ visible: true, x: pos.x, y: pos.y, text: `Contribution by: ${artistName}` });
    }, []); // tooltip state ko direct set kar rahe hain, isliye dependency ki zaroorat nahi

    const handleContributionLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);



    const handleCanvasStateChange = useCallback((newState: any) => {
        setCanvasStats(prev => ({ ...prev, ...newState }));

    }, []); // Empty dependency array, yeh function kabhi nahi badlega


    // const loadReferenceImage = () => {
    // const tile = getTile(0, 0);
    // const ctx = tile.context;
    // ctx.save();
    // const scale = 0.5, offsetX = 60, offsetY = 80;
    // ctx.fillStyle = '#8B4513';
    // ctx.fillRect(100 * scale + offsetX, 150 * scale + offsetY, 80 * scale, 60 * scale);
    // ctx.fillStyle = '#CD5C5C';
    // ctx.beginPath();
    // ctx.moveTo(90 * scale + offsetX, 150 * scale + offsetY);
    // ctx.lineTo(140 * scale + offsetX, 120 * scale + offsetY);
    // ctx.lineTo(190 * scale + offsetX, 150 * scale + offsetY);
    // ctx.closePath();
    // ctx.fill();
    // ctx.restore();
    // tile.isDirty = true;
    // renderVisibleTiles();
    // };

    const showLoginDialog = !!currentProject && !user && !loginDialogDismissed;
    const showJoinDialog = isJoinDialogOpen && !showLoginDialog;

    const isCurrentUserAContributor = useMemo(() => {
        if (!user || !currentProject?.contributors) {
            return false;
        }

        return currentProject.contributors.some((contributor: any) => {
            if (typeof contributor === "string") {
                return contributor === user._id;
            }
            if (typeof contributor === "object" && contributor?._id) {
                return contributor._id === user._id;
            }
            return false;
        });
    }, [currentProject, user]);


    const handleJoin = async () => {
        try {
            if (!user?._id) {
                toast.error("User ID is missing.");
                return;
            }

            await dispatch(joinProject({ projectId, userId: user._id })).unwrap();

            toast.success("You have joined the project! You can now contribute.");
        } catch (error: any) {
            console.error("Failed to join project:", error);
            // If your backend sends message in error.response.data.message or error.message
            const msg = error || "Failed to join the project. Please try again.";
            toast.error(msg);
        }
    };

    const handleGuestCanvasInteraction = useCallback(() => {
        console.log("A guest is trying to draw. Opening login modal.");
        setLoginDialogDismissed(false);
        dispatch(openAuthModal()); // Auth modal ke liye
    }, [dispatch]);



    useEffect(() => {
        if (currentProject && user && !isCurrentUserAContributor && !isReadOnly) {
            setIsJoinDialogOpen(true);
        }
        if (isCurrentUserAContributor) {
            setIsJoinDialogOpen(false);
        }
    }, [currentProject, user, isCurrentUserAContributor]);

    useEffect(() => {
        if (isTimelapseOpen) {
            dispatch(generateTimelapseVideo({ projectId }));
        }
    }, [isTimelapseOpen, projectId, dispatch]);

    useEffect(() => {
        if (selectedContributionId && listItemRefs.current[selectedContributionId]) {
            // Step 3: Agar selected ID hai, to us element par scroll karo.
            listItemRefs.current[selectedContributionId].scrollIntoView({
                behavior: 'smooth', // Smooth scrolling
                block: 'center'    // Element ko screen ke center mein laao
            });
        }
    }, [selectedContributionId]); // Yeh effect sirf tab chalega jab selection badlega.

    useLayoutEffect(() => {
        const updateSize = () => {
            if (canvasContainerRef.current) {
                setCanvasSize({
                    width: canvasContainerRef.current.offsetWidth,
                    height: canvasContainerRef.current.offsetHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {

        console.log(`Fetching strokes for projectId: ${projectId}`);
        // dispatch(getContributionsByProject({ projectId }));

        // ya jab `projectId` badlega (naye data fetch hone se pehle).
        return () => {
            console.log("Cleaning up canvas for new project...");

            // 1. Redux store se purane strokes saaf karein
            dispatch(clearCanvasData());

            // 2. Component ke local state (tiles) ko saaf karein
            tilesRef.current.clear();

            // // 4. Viewport ko turant saaf karein taaki user ko blank canvas dikhe
            // const viewport = viewportCanvasRef.current;
            // if (viewport) {
            //     const ctx = viewport.getContext('2d')!;
            //     ctx.clearRect(0, 0, viewport.width, viewport.height);
            // }
        }
    }, [projectId, dispatch]);


    useEffect(() => {
        if (!projectId) return;

        const newSocket = io(import.meta.env.VITE_BASE, {
            // Connection ke waqt query parameters mein userId bhejein
            query: {
                userId: user?._id
            }
        });
        setSocket(newSocket);

        newSocket.emit('join_project', projectId);

        // --- MOJOODA LISTENER ---
        newSocket.on('drawing_received', (newContribution) => {
            // YEH CONSOLE.LOG CHECK KAREIN
            console.log('Received new contribution via socket on other client:', newContribution);
            dispatch(addContributionFromSocket(newContribution));
        });

        // (2) Jab doosre user ka cursor move ho
        newSocket.on('cursor_update', (data) => {
            const { socketId, user, position } = data;
            // Naye cursor data ko state mein add/update karein
            setCursors(prevCursors => ({
                ...prevCursors,
                [socketId]: { user, position }
            }));
        });

        // (3) Jab koi user chala jaye
        newSocket.on('user_left', (socketId) => {
            // Us user ke cursor ko state se hata dein
            setCursors((prevCursors: any) => {
                const newCursors = { ...prevCursors };
                delete newCursors[socketId];
                return newCursors;
            });
        });

        return () => {
            newSocket.disconnect();
        };

    }, [projectId, user, dispatch]);

    // === "SCROLL TO VIEW" ki LOGIC BHI YAHAN HAI ===
    useEffect(() => {
        // Yeh effect sirf tab chalega jab selection badlega
        if (selectedContributionId) {
            // (1) Sidebar ko kholein
            setIsSidebarOpen(true);

            // (2) Scroll karein
            const timer = setTimeout(() => {
                const element = listItemRefs.current[selectedContributionId];
                if (element) {
                    console.log(`ProjectPage useEffect: Scrolling to ${selectedContributionId}`);
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    console.warn(`ProjectPage useEffect: Element for ${selectedContributionId} not found.`);
                }
            }, 300); // Animation ke liye delay

            return () => clearTimeout(timer);
        }
    }, [selectedContributionId]);


    useEffect(() => {
        if (!socket) return;

        if (currentProject.status === 'Paused' /*|| currentProject.status === 'Completed'*/) {
            navigate(`/projects`);
            toast.warning("The project is no longer active. Redirecting to projects page.");
        }
        const handleDeleteEvent = ({ contributionId }: { contributionId: string }) => {
            console.log(`[Socket] Received delete event for contribution: ${contributionId}`);
            // Socket se anay par UI foran update karein
            dispatch(removeContributionOptimistically({ contributionId }));
        };
        const handleContributorJoined = ({ newContributor }: { newContributor: any }) => {
            console.log(`[Socket] New contributor joined:`, newContributor);
            // Jab naya contributor join kare, to usay Redux state mein add kar dein
            dispatch(addContributorToState(newContributor));
        };
        // --- YAHAN PAR ISTEMAL HO RAHA HAI ---
        const handleContributorRemoved = ({ removedUserId }: { removedUserId: string }) => {
            console.log(`[Socket] Received event: Contributor ${removedUserId} was removed.`);

            // Reducer ko dispatch karein taake UI update ho
            dispatch(removeContributorFromState({ removedUserId }));

            // Agar main khud remove hua hoon, to user ko batayein
            if (user?._id === removedUserId) {
                toast.warning("Your contributor access for this project has been revoked.");
            }
        };
        const handleContributionDeleted = ({ contributionId }: { contributionId: string }) => {
            console.log(`[Socket] Received delete event for contribution: ${contributionId}`);

            // Redux action ko dispatch karein taake UI foran update ho
            dispatch(removeContributionFromState({ contributionId }));

            // (Optional) Ek chota sa toaster dikhayein
            toast.info("A contribution was removed by an admin.");
        };
        const handleCanvasCleared = (data: { projectId: string }) => {
            // Safety check: Yaqeeni banayein ke event isi project ke liye hai
            if (data.projectId === projectId) {
                console.log(`[Socket] Received event: Canvas for project ${data.projectId} was cleared.`);

                // Redux action ko dispatch karein taake UI foran update ho
                dispatch(clearAllContributionsFromState());

                // User ko ek saaf message dikhayein
                toast.warning("The canvas has been cleared by an admin.");
            }
        };
        const handleContributionsPurged = ({ deletedContributionIds }: { deletedContributionIds: string[] }) => {
            console.log(`[Socket] Received event: ${deletedContributionIds.length} contributions were purged.`);

            // Reducer ko dispatch karein taake UI foran update ho
            dispatch(removeMultipleContributionsFromState(deletedContributionIds));

            toast.info("A removed user's contributions have been cleared from the canvas.");
        };

        const handleStatusUpdate = (newStatus: string) =>
            (data: { projectId: string, message: string }) => {

                // Only act if the event is for the project we are currently viewing
                if (data.projectId === projectId) {
                    console.log(`[Socket] Received project status change: ${newStatus}`);
                    if (newStatus === "Paused") {
                        toast.warning("The project has been paused by an admin. Contributions are now disabled.");
                        navigate(`/projects`);
                    }
                    if (newStatus === "Completed") {

                        toast.warning("The project has been Completed by an admin.");
                        navigate(`/gallery`);
                    }
                    // Dispatch the action to update the status in the Redux state
                    dispatch(updateProjectStatusInState({ projectId, status: newStatus }));

                    // Show a notification
                    toast.info(data.message);
                }
            };
        const handleVoteUpdate = (data: { contribution: any }) => {
            console.log(`[Socket] Received vote update for contribution ${data.contribution._id}`);

            // Dispatch the action to update the specific contribution in the Redux store
            dispatch(updateContributionInState(data.contribution));
        };


        const onProjectPaused = handleStatusUpdate('Paused');
        const onProjectCompleted = handleStatusUpdate('Completed');
        const onProjectResumed = handleStatusUpdate('Active');

        socket.on('vote_updated', handleVoteUpdate);
        socket.on('project_paused', onProjectPaused);
        socket.on('project_completed', onProjectCompleted);
        socket.on('project_resumed', onProjectResumed);
        socket.on('contributions_purged', handleContributionsPurged);
        socket.on('canvas_cleared', handleCanvasCleared);
        socket.on('contribution_deleted', handleContributionDeleted);
        socket.on('contributor_removed', handleContributorRemoved);
        socket.on('contributor_joined', handleContributorJoined);
        socket.on('contribution_deleted', handleDeleteEvent);

        return () => {
            socket.off('contribution_deleted', handleDeleteEvent);
            socket.off('contributor_joined', handleContributorJoined);
            socket.off('contributor_removed', handleContributorRemoved);
            socket.off('contribution_deleted', handleContributionDeleted);
            socket.off('canvas_cleared', handleCanvasCleared);
            socket.off('contributions_purged', handleContributionsPurged);
            socket.off('project_paused', onProjectPaused);
            socket.off('project_completed', onProjectCompleted);
            socket.off('project_resumed', onProjectResumed);
            socket.off('vote_updated', handleVoteUpdate);

        };
    }, [socket, dispatch, user]);

    // This logic will now react to real-time state changes from the listener
    // const isGalleryView = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'gallery', []);
    // const isProjectInactive = currentProject?.status === 'Paused' || currentProject?.status === 'Completed';
    // const finalIsReadOnly = isGalleryView || isProjectInactive;

    return (
        // Design ke mutabiq page ka background color
        <div ref={mainContentRef} className="relative  min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">

                {/* Yahan aapka page header aur "Back" button aa sakta hai */}
                <div className="mb-4 text-center">
                    <h1 className="text-[28px] lg:text-[44.8px]     font-serif text-[#3E2723]">{projectName}</h1>
                    <p className="text-[#8D6E63] italic lg:text-[19.2px]">{currentProject?.description}</p>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Left Column: Toolbox */}
                    {!isReadOnly && <Toolbox boundaryRef={mainContentRef} />}


                    {/* Right Column: Canvas & Actions */}
                    <div className="flex-1 flex flex-col items-center ">

                        {/* Top Action Buttons */}

                        <div className="flex justify-center gap-3">
                            {/* <button
                                onClick={loadReferenceImage}
                                className="bg-[#8b795e] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded cursor-pointer"
                            >
                                Load Image
                            </button> */}

                            {user?.role == 'admin' && <button
                                onClick={handleGenerateTimelapse}
                                disabled={isGeneratingTimelapse}
                                className="bg-[#003366] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2  rounded cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                                <Film size={16} />
                                {isGeneratingTimelapse ? 'Generating...' : 'Create Timelapse'}
                            </button>}
                            {user?.role == 'admin' && <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>


                                <AlertDialogTrigger asChild>
                                    <button
                                        // 1. Button ko disable karein agar drawing save ho rahi hai
                                        disabled={isContributionSaving || isClearingCanvas}

                                        // 2. Title attribute se user ko wajah batayein (hover karne par dikhega)
                                        title={isSaving ? "Cannot clear while a drawing is being saved" : "Clear the entire canvas"}

                                        // 3. Styling add karein taake user ko pata chale ke button disabled hai
                                        className="bg-[#cd5c5c] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded cursor-pointer
                                        transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear Canvas
                                    </button>
                                </AlertDialogTrigger>

                                {/* Yeh dialog ka content hai */}
                                <AlertDialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl !text-white">
                                            Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-300 pt-2">
                                            This action cannot be undone. This will permanently delete all
                                            the drawings for the project <strong className="text-amber-300">{projectName}</strong> from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-4">
                                        {/* Cancel Button */}
                                        <AlertDialogCancel
                                            className="bg-transparent cursor-pointer border border-gray-500 text-white hover:bg-gray-700 hover:text-white"
                                        >
                                            Cancel
                                        </AlertDialogCancel>

                                        {/* Continue Button (Destructive Action) */}
                                        <AlertDialogAction
                                            onClick={handleClearCanvas}
                                            className="bg-red-600 text-white cursor-pointer hover:bg-red-700"

                                        >
                                            Yes, Clear Canvas
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>}

                            {/* <button
                                // onClick={() => setShowGrid(!showGrid)}
                                className={`${true ? 'bg-[#5d4037]' : 'bg-[#8b795e]'
                                    } text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2  rounded cursor-pointer flex items-center gap-2`}
                            >
                                <Grid size={16} />
                                {true ? 'Hide Grid' : 'Show Grid'}
                            </button> */}

                        </div>
                        {/* Canvas Container (Aapki CSS classes ke sath) */}

                        <div className='text-[1rem] w-[90%] xl:w-full bg-[#F5F5DC] text-[#5D4037] px-4 py-4 rounded-[5px] shadow-md mt-4 mb-6'>
                            <p>Use the mouse wheel to zoom, right-click to pan, and left click to draw when zoomed in to at least 100%. <span className=''>Drag the drawings tools and canvas info boxes to wherever you like. Use the scale reference on the right and bottom sides of the viewport to keep scale while drawing.</span> </p>
                        </div>
                        <div className="canvas-count  w-[90%]  xl:w-full ">
                            <div className="stat-item">
                                <span className="stat-label  !text-[14.4px]">Total Contributors:</span>
                                <span className="stat-value  !text-[14.4px]" id="contributor-count">{totalContributors}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]" >Pixels Painted:</span>
                                <span className="stat-value !text-[14.4px]" id="pixel-count">{currentProject?.stats?.pixelCount}/104,857,600</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]">Canvas Size:</span>
                                <span className="stat-value !text-[14.4px]">2560px by 2560px</span>
                            </div>
                        </div>

                        {/* <div className='w-full h-full min-w-[1024px] min-h-[1024px] bg-white relative overflow-hidden'> */}
                        <div
                            ref={canvasContainerRef}
                            className=' h-full w-[90%] xl:w-[1024px] min-h-[1024px] mt-6 bg-white relative overflow-hidden'
                            style={{ border: '4px solid #4d2d2d' }}
                        >
                            {canvasSize.width > 0 && (
                                <KonvaCanvas
                                    socket={socket} // Naya prop
                                    projectId={projectId}
                                    userId={user?._id}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    virtualWidth={currentProject.width}
                                    virtualHeight={currentProject.height}
                                    onStateChange={handleCanvasStateChange} // Callback function pass karein
                                    selectedContributionId={selectedContributionId}
                                    onContributionHover={handleContributionHover}
                                    onContributionLeave={handleContributionLeave}
                                    // onContributionSelect={setSelectedContributionId}
                                    onContributionSelect={handleCanvasClick}
                                    setIsContributionSaving={setIsContributionSaving}
                                    onGuestInteraction={handleGuestCanvasInteraction}
                                    isContributor={isCurrentUserAContributor}
                                    // onContributionSelect={handleCanvasContributionSelect} 

                                    isReadOnly={isReadOnly} // Naya prop pass karein
                                    onClearHighlight={handleClearHighlight} // <-- YEH NAYA PROP PASS KAREIN

                                />
                            )}
                            {Object.entries(cursors as Record<string, CursorData>).map(([socketId, data]) => (
                                <div
                                    key={socketId}
                                    className="absolute z-50 pointer-events-none"
                                    style={{
                                        left: `${data.position.x}px`,
                                        top: `${data.position.y}px`,
                                        transition: 'left 0.1s linear, top 0.1s linear' // Thori si smoothness ke liye
                                    }}
                                >

                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: data.user?.color || 'blue' }}>
                                        <path d="M4 4l7.071 17.071-1.414 1.414-4.243-4.243-1.414-1.414L4 4z" fill="currentColor" />
                                    </svg>
                                    <span
                                        className="bg-black text-white text-xs px-2 py-1 rounded"
                                        style={{ backgroundColor: data.user?.color || 'blue', marginLeft: '5px' }}
                                    >
                                        {data.user?.name || 'Guest'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* </div> */}
                        {!isReadOnly && <InfoBox
                            zoom={canvasStats.zoom}
                            worldPos={canvasStats.worldPos}
                            strokeCount={savedStrokes?.length || 0}
                            isSaving={isContributionSaving}
                            saveError={saveError}
                            boundaryRef={mainContentRef} // <-- YEH PROP ADD KAREIN

                        />}
                        {tooltip.visible && (
                            <div
                                className="absolute z-[100] bg-black text-white text-xs px-2 py-1 rounded-sm pointer-events-none"
                                style={{
                                    top: tooltip.y + 20, // Position below the cursor
                                    left: tooltip.x + 20, // Position to the right of the cursor
                                }}
                            >
                                {tooltip.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={showJoinDialog} onOpenChange={setIsJoinDialogOpen}>
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl !text-white text-center">Join as a Contributor</DialogTitle>
                        <DialogDescription className="pt-4 text-base text-gray-300">
                            By clicking "Agree and Continue", you agree to the project's terms of contribution. Your artwork will become part of this collaborative canvas.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Yahan aap aage ja kar legal text daal sakte hain */}
                    <DialogFooter>
                        {/* ShadCN DialogClose cross icon ko aasan banata hai */}
                        <DialogClose asChild>
                            <Button variant="outline" className="cursor-pointer">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleJoin}
                            disabled={loading.joining}
                            className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50"
                        >
                            {loading.joining ? 'Joining...' : 'Agree and Continue'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- "LOGIN TO CONTRIBUTE" DIALOG --- */}
            <Dialog open={showLoginDialog} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setLoginDialogDismissed(true); // Agar dialog band ho, to usay dismiss mark kar dein
                }
            }}>
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl !text-white text-center">Want to Contribute?</DialogTitle>
                        <DialogDescription className="pt-4 text-base text-gray-300">
                            To paint, vote, or join this project, you need to be logged in. You can continue to browse as a guest.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {/* DialogClose ab "Stay as Guest" ka kaam karega */}
                        <DialogClose asChild>
                            <Button variant="outline" className="cursor-pointer">Stay as Guest</Button>
                        </DialogClose>
                        <Button onClick={() => {
                            dispatch(openAuthModal());
                            setLoginDialogDismissed(true)
                        }} className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50"
                        >
                            Login or Sign Up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <ContributionSidebar
                projectId={projectId}
                contributions={contributions} // TODO: Isay proper contribution objects mein badalna hoga
                selectedContributionId={selectedContributionId}
                // onContributionSelect={setSelectedContributionId}
                canvasStats={canvasStats}
                infoBoxData={{
                    strokeCount: savedStrokes.length,
                    isSaving: isSaving,
                    saveError: saveError
                }}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                listItemRefs={listItemRefs}
                onGuestVoteAttempt={handleGuestCanvasInteraction}
                isReadOnly={isReadOnly} // Naya prop pass karein
                onContributionSelect={handleSidebarContributionSelect} // Sidebar ko apna alag function dein


            />
            <Dialog open={isTimelapseOpen} onOpenChange={handleModalClose}>
                <DialogContent className={`
            bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] p-0
            transition-all duration-300 ease-in-out
            ${isTimelapseFullscreen
                        ? 'fixed inset-0 w-full h-full max-w-full max-h-full rounded-none' // Fullscreen styles
                        : 'sm:max-w-4xl md:max-w-5xl lg:max-w-6xl' // Default modal styles
                    }
        `}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl !text-white text-center pt-3">Project Timelapse</DialogTitle>
                    </DialogHeader>

                    <div className="min-h-[400px] flex justify-center items-center p-4">
                        {isGenerating && (
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-lg">Generating your timelapse...</p>
                                <p className="text-sm text-gray-400">This might take a moment.</p>
                            </div>
                        )}

                        {!isGenerating && generationError && (
                            <div className="text-center text-red-400">
                                {/* <h3 className="text-xl font-bold !text-white mb-2">Error!</h3> */}
                                {/* <p>Failed to generate the timelapse.</p> */}
                                <p className="text-lg text-white mt-1">{generationError}</p>
                            </div>
                        )}

                        {/* Case 3: Success State (Video Ready) */}
                        {!isGenerating && timelapseUrl && (
                            <video
                                key={timelapseUrl}
                                src={`${import.meta.env.VITE_BASE}${timelapseUrl}`}
                                controls
                                autoPlay
                                muted
                                playsInline
                                className={`
                        w-full h-auto rounded-lg
                        ${isTimelapseFullscreen
                                        ? 'max-h-screen' // Allow full screen height
                                        : 'max-h-[85vh]'   // Default max height
                                    }
                    `}
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectPage;