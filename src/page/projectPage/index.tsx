// src/pages/ProjectPage.js

import Toolbox from '@/components/toolbox/Toolbox';
import { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import KonvaCanvas from '../../components/common/KonvaCanvas';
import {  Film } from 'lucide-react'; // Grid icon imported

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
import type { RootState } from '@/redux/store';
import { clearCanvas, generateTimelapseVideo, getContributionsByProject } from '@/redux/action/contribution';
import InfoBox from '@/components/toolbox/InfoBox';
import { useSelector } from 'react-redux';
import { clearCanvasData, selectCanvasData, selectErrorForOperation, selectIsLoadingOperation, selectTimelapseUrl } from '@/redux/slice/contribution';
import ContributionSidebar from '@/components/ContributionSidebar';
import { joinProject } from '@/redux/action/project';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';
import { openAuthModal } from '@/redux/slice/opeModal';
import { useSearchParams } from 'react-router-dom';


const TILE_SIZE = 512; // Optimal tile size for performance

const ProjectPage = ({ projectName, projectId }: any) => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const canvasContainerRef = useRef<any>(null);
    const [canvasSize, setCanvasSize] = useState<any>({ width: 0, height: 0 });
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
    const [selectedContributionId, setSelectedContributionId] = useState(null);
    const [isGeneratingTimelapse, setIsGeneratingTimelapse] = useState(false);
    const listItemRefs = useRef<any>({});
    const { currentProject, loading } = useSelector((state: RootState) => state?.projects);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [loginDialogDismissed, setLoginDialogDismissed] = useState(false);
    // --- NAYI LOGIC: Read-only mode ko check karein ---
    const [searchParams] = useSearchParams();
    const isReadOnly = searchParams.get('view') === 'gallery';
    const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);
    // --- REDUX STATE for Timelapse ---
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const isGenerating = useSelector(selectIsLoadingOperation('generateTimelapse'));
    const generationError = useSelector(selectErrorForOperation('generateTimelapse'));
    const savedStrokes = useSelector(selectCanvasData);
    const isSaving = useSelector(selectIsLoadingOperation('createContribution')); // Updated to new state
    const saveError = useSelector(selectErrorForOperation('createContribution')); // Updated to new state

    const {
        tilesRef,
        isClearAlertOpen,
        setIsClearAlertOpen,
    } = useCanvasState();

    const [canvasStats, setCanvasStats] = useState({
        zoom: 1,
        worldPos: { x: 0, y: 0 },
    });

    const handleGenerateTimelapse = () => {
        if (!projectId) {
            toast.error("Project ID is not available.");
            return;
        }
        setIsGeneratingTimelapse(true)
        dispatch(generateTimelapseVideo({ projectId })).unwrap().finally(() => {
            setIsGeneratingTimelapse(false);
            setIsTimelapseOpen(true);
        }) as any;
    };
    const handleClearCanvas = () => {
        dispatch(clearCanvas({ projectId }));
        tilesRef.current.forEach((tile: any) => {
            tile.context.fillStyle = '#ffffff';
            tile.context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.isDirty = true;
        });


    };
    // --- NEW HANDLERS to pass down as props ---
    const handleContributionHover = (contribution: any, pos: any) => {
        const artistName = contribution.userId?.fullName || 'Unknown Artist';
        setTooltip({
            visible: true,
            x: pos.x,
            y: pos.y,
            text: `Contribution by: ${artistName}`
        });
        // console.log("contribution:", contribution)
    };
    const handleContributionLeave = () => {
        setTooltip({ ...tooltip, visible: false });
    };

  

    const handleCanvasStateChange = (newState: any) => {
        setCanvasStats(prev => ({ ...prev, ...newState }));
    };

    const loadReferenceImage = () => {
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
    };

    const showLoginDialog = !!currentProject && !user && !loginDialogDismissed;
    const showJoinDialog = isJoinDialogOpen && !showLoginDialog;

    const isCurrentUserAContributor = useMemo(() => {
        if (!user || !currentProject?.contributors) {
            return false;
        }
        return currentProject.contributors.includes(user?.id);
    }, [currentProject, user]);

    const handleJoin = () => {
        dispatch(joinProject({ projectId, userId: user?.id }));
    };
    const handleGuestCanvasInteraction = () => {
        console.log("A guest is trying to draw. Opening login modal.");
        // Login dialog ko dobara 'un-dismiss' kar dein taake woh nazar aaye
        setLoginDialogDismissed(false);
    };
    useEffect(() => {
        // Automatically open the dialog if the user is logged in but not a contributor
        // and the project data has loaded.
        if (currentProject && user && !isCurrentUserAContributor) {
            setIsJoinDialogOpen(true);
        } else {
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
    return (
        // Design ke mutabiq page ka background color
        <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">

                {/* Yahan aapka page header aur "Back" button aa sakta hai */}
                <div className="mb-4 text-center">
                    <h1 className="text-[44.8px] font-serif text-[#3E2723]">{projectName}</h1>
                    <p className="text-[#8D6E63] italic text-[19.2px]">{currentProject?.description}</p>
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

                           { user?.role=='admin' && <button
                                onClick={handleGenerateTimelapse}
                                disabled={isGeneratingTimelapse}
                                className="bg-[#003366] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2  rounded cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                                <Film size={16} />
                                {isGeneratingTimelapse ? 'Generating...' : 'Create Timelapse'}
                            </button>}
                            {user?.role == 'admin' &&  <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>


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

                        <div className='text-[1rem]  bg-[#F5F5DC] text-[#5D4037] px-4 py-4 rounded-[5px] shadow-md mt-4 mb-6'>
                            <p>Use the mouse wheel to zoom, right-click to pan, and left click to draw when zoomed in to at least 100%. Drag the drawings tools and canvas info boxes to wherever you like. Use the scale reference on the right and bottom sides of the viewport to keep scale while drawing.</p>
                        </div>
                        <div className="canvas-count w-full ">
                            <div className="stat-item">
                                <span className="stat-label  !text-[14.4px]">Total Contributors:</span>
                                <span className="stat-value  !text-[14.4px]" id="contributor-count">{currentProject?.stats?.contributorCount}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]" >Pixels Painted:</span>
                                <span className="stat-value !text-[14.4px]" id="pixel-count">0/104,857,600</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label !text-[14.4px]">Canvas Size:</span>
                                <span className="stat-value !text-[14.4px]">10240px by 10240px</span>
                            </div>
                        </div>
                        <div
                            ref={canvasContainerRef}
                            className='w-[95%] md:w-[90%] h-[600px] mt-10 md:h-[800px] xl:w-[1024px] xl:h-[1024px] relative bg-white'
                            style={{ border: '4px solid #4d2d2d' }}
                        >
                            {canvasSize.width > 0 && (
                                <KonvaCanvas
                                    projectId={projectId}
                                    userId={user?.id}
                                    width={canvasSize.width}
                                    height={canvasSize.height}
                                    onStateChange={handleCanvasStateChange} // Callback function pass karein
                                    selectedContributionId={selectedContributionId}
                                    onContributionHover={handleContributionHover}
                                    onContributionLeave={handleContributionLeave}
                                    onContributionSelect={setSelectedContributionId}
                                    onGuestInteraction={handleGuestCanvasInteraction}
                                    isContributor={isCurrentUserAContributor}

                                    isReadOnly={isReadOnly} // Naya prop pass karein

                                />
                            )}

                        </div>

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
                        <Button onClick={() =>{ 
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
                contributions={savedStrokes} // TODO: Isay proper contribution objects mein badalna hoga
                selectedContributionId={selectedContributionId}
                onContributionSelect={setSelectedContributionId}
                canvasStats={canvasStats}
                infoBoxData={{
                    strokeCount: savedStrokes.length,
                    isSaving: isSaving,
                    saveError: saveError
                }}
                listItemRefs={listItemRefs}
                onGuestVoteAttempt={handleGuestCanvasInteraction}
                isReadOnly={isReadOnly} // Naya prop pass karein

            />
            <Dialog open={isTimelapseOpen} onOpenChange={setIsTimelapseOpen}>
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
                                key={timelapseUrl} // Key ensures the video re-renders if the URL changes
                                src={`${import.meta.env.VITE_BASE}${timelapseUrl}`}
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