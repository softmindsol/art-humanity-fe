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
import { clearCanvas, generateTimelapseVideo, getContributionsByProject } from '@/redux/action/contribution';
import InfoBox from '@/components/toolbox/InfoBox';
import { clearCanvasData, clearTimelapseUrl, selectCanvasData, selectErrorForOperation, selectIsLoadingOperation, selectTimelapseUrl } from '@/redux/slice/contribution';
import ContributionSidebar from '@/components/ContributionSidebar';
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
import { selectCurrentProject } from '@/redux/slice/project';
import type { RootState } from '@/redux/store';


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
const ProjectPage = ({ projectName, projectId }: any) => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();

    // --- STATES ---
    const [socket, setSocket] = useState<any>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedContributionId, setSelectedContributionId] = useState(null);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [loginDialogDismissed, setLoginDialogDismissed] = useState(false);
    const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
    const [isGeneratingTimelapse, _] = useState(false);
    const contributions = useSelector(selectCanvasData);
    const { loading } = useSelector((state: RootState) => state.projects);
    // --- REFS ---
    const canvasContainerRef = useRef<any>(null);
    const listItemRefs = useRef<any>({});
    const [cursors, setCursors] = useState<Record<string, any>>({});

    // --- REDUX SELECTORS ---
    const currentProject = useSelector(selectCurrentProject);
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const isGenerating = useSelector(selectIsLoadingOperation('generateTimelapse'));
    const generationError = useSelector(selectErrorForOperation('generateTimelapse'));
    const isReadOnly = useMemo(() => new URLSearchParams(window.location.search).get('view') === 'gallery', []);
    const savedStrokes = useSelector(selectCanvasData);
    const isSaving = useSelector(selectIsLoadingOperation("createContribution"));
    const saveError = useSelector(selectErrorForOperation("createContribution"));

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
        }
        setIsTimelapseOpen(isOpen);
    };
    const {
        tilesRef,
        isClearAlertOpen,
        setIsClearAlertOpen,
    } = useCanvasState();

    const [canvasStats, setCanvasStats] = useState({
        zoom: 1,
        worldPos: { x: 0, y: 0 },
    });


    // Canvas se click handle karne wala function
    const handleCanvasClick = (contributionId: any) => {
        console.log(`Canvas clicked. Setting selected ID to: ${contributionId}`);
        setSelectedContributionId(contributionId);
    };



    const handleSidebarContributionSelect = useCallback((contributionId: any) => {
        setSelectedContributionId(contributionId);
        // Sidebar pehle se khula hai, usay dobara kholne ki zaroorat nahi
    }, []);

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
        const artistName = contribution.userId?.fullName || 'Unknown Artist';
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
                return contributor === user.id;
            }
            if (typeof contributor === "object" && contributor?._id) {
                return contributor._id === user.id;
            }
            return false;
        });
    }, [currentProject, user]);


    const handleJoin = () => {
        dispatch(joinProject({ projectId, userId: user?.id })).unwrap()
        toast.success("You have joined the project! You can now contribute.");
    };
    const handleGuestCanvasInteraction = useCallback(() => {
        console.log("A guest is trying to draw. Opening login modal.");
        setLoginDialogDismissed(false);
        dispatch(openAuthModal()); // Auth modal ke liye
    }, [dispatch]);



    useEffect(() => {
        if (currentProject && user && !isCurrentUserAContributor) {
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
        dispatch(getContributionsByProject({ projectId }));

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
                userId: user?.id
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
    // console.log("Rendering cursors:", cursors);
    return (
        // Design ke mutabiq page ka background color
        <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">

                {/* Yahan aapka page header aur "Back" button aa sakta hai */}
                <div className="mb-4 text-center">
                    <h1 className="text-[28px] lg:text-[44.8px] font-serif text-[#3E2723]">{projectName}</h1>
                    <p className="text-[#8D6E63] italic lg:text-[19.2px]">{currentProject?.description}</p>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Left Column: Toolbox */}
                    {!isReadOnly && <Toolbox />}


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
                                        className="bg-[#cd5c5c] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded cursor-pointer"
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
                                            the drawings for the project <strong className="text-amber-300">{'projectName'}</strong> from our servers.
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
                                <span className="stat-value  !text-[14.4px]" id="contributor-count">{currentProject?.stats?.contributorCount}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]" >Pixels Painted:</span>
                                <span className="stat-value !text-[14.4px]" id="pixel-count">{currentProject?.stats?.pixelCount}/104,857,600</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]">Canvas Size:</span>
                                <span className="stat-value !text-[14.4px]">1024px by 1024px</span>
                            </div>
                        </div>

                        {/* <div className='w-full h-full min-w-[1024px] min-h-[1024px] bg-white relative overflow-hidden'> */}
                        <div
                            ref={canvasContainerRef}
                            className=' h-full w-[95%] lg:w-[1024px] min-h-[1024px] mt-6 bg-white relative overflow-hidden'
                            style={{ border: '4px solid #4d2d2d' }}
                        >
                            {canvasSize.width > 0 && (
                                <KonvaCanvas
                                    socket={socket} // Naya prop
                                    projectId={projectId}
                                    userId={user?.id}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    onStateChange={handleCanvasStateChange} // Callback function pass karein
                                    selectedContributionId={selectedContributionId}
                                    onContributionHover={handleContributionHover}
                                    onContributionLeave={handleContributionLeave}
                                    // onContributionSelect={setSelectedContributionId}
                                    onContributionSelect={handleCanvasClick}

                                    onGuestInteraction={handleGuestCanvasInteraction}
                                    isContributor={isCurrentUserAContributor}
                                    // onContributionSelect={handleCanvasContributionSelect} 

                                    isReadOnly={isReadOnly} // Naya prop pass karein

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
                                    {/* Aap yahan custom cursor icon istemal kar sakte hain */}
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
                        <InfoBox
                            zoom={canvasStats.zoom}
                            worldPos={canvasStats.worldPos}
                            strokeCount={savedStrokes?.length || 0}
                            isSaving={isSaving}
                            saveError={saveError}
                        />
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
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl !text-white text-center">Project Timelapse</DialogTitle>
                    </DialogHeader>

                    <div className="min-h-[400px] flex justify-center items-center p-4">
                        {/* Case 1: Loading State */}
                        {isGenerating && (
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-lg">Generating your timelapse...</p>
                                <p className="text-sm text-gray-400">This might take a moment.</p>
                            </div>
                        )}

                        {/* Case 2: Error State */}
                        {!isGenerating && generationError && (
                            <div className="text-center text-red-400">
                                <h3 className="text-xl font-bold mb-2">Error!</h3>
                                <p>Failed to generate the timelapse.</p>
                                <p className="text-xs text-gray-500 mt-1">{generationError}</p>
                            </div>
                        )}

                        {/* Case 3: Success State (Video Ready) */}
                        {!isGenerating && timelapseUrl && (
                            <video
                                key={`${timelapseUrl}?t=${new Date().getTime()}`}
                                src={`${import.meta.env.VITE_BASE}${timelapseUrl}?t=${new Date().getTime()}`}
                                controls
                                autoPlay
                                className="w-full max-h-[70vh] rounded-lg"
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