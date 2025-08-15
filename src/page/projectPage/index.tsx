// src/pages/ProjectPage.js

import Toolbox from '@/components/toolbox/Toolbox';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import KonvaCanvas from '../../components/common/KonvaCanvas';
import { Grid, Film } from 'lucide-react'; // Grid icon imported

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
import { useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import { clearCanvas, generateTimelapseVideo, getContributionsByProject } from '@/redux/action/painPixel';
import InfoBox from '@/components/toolbox/InfoBox';
import { useSelector } from 'react-redux';
import { clearCanvasData, selectCanvasData, selectErrorForOperation, selectIsLoadingOperation } from '@/redux/slice/paintPixel';
import ContributionSidebar from '@/components/ContributionSidebar';


const TILE_SIZE = 512; // Optimal tile size for performance
const VIEWPORT_WIDTH = 1024; // Fixed viewport width
const VIEWPORT_HEIGHT = 1024; // Fixed viewport height

const ProjectPage = ({ projectName, projectId }: any) => {
    const user = useSelector((state: RootState) => state?.auth?.user);
    const canvasContainerRef = useRef<any>(null);
    const [canvasSize, setCanvasSize] = useState<any>({ width: 0, height: 0 });
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
    const [selectedContributionId, setSelectedContributionId] = useState(null);

    const dispatch = useDispatch<AppDispatch>();
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
            alert("Session ID is not available.");
            return;
        }
        console.log(`Requesting timelapse for session: ${projectId}`);
        dispatch(generateTimelapseVideo({ projectId }) as any);
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
        setTooltip({
            visible: true,
            x: pos.x,
            y: pos.y,
            text: `Contribution by: ${contribution.userId}`
        });
    };

    const handleContributionLeave = () => {
        setTooltip({ ...tooltip, visible: false });
    };

    // Yeh function KonvaCanvas se state receive karega


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
                    <h1 className="text-3xl font-serif text-gray-800">{projectName}</h1>
                    <p className="text-gray-600 italic">Using Konva.js for a better experience. Zoom with wheel, pan with Move tool.</p>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Left Column: Toolbox */}
                    <Toolbox />

                    {/* Right Column: Canvas & Actions */}
                    <div className="flex-1 flex flex-col items-center ">

                        {/* Top Action Buttons */}

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={loadReferenceImage}
                                className="bg-[#8b795e] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded cursor-pointer"
                            >
                                Load Image
                            </button>

                            <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>


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
                            </AlertDialog>

                            <button
                                // onClick={() => setShowGrid(!showGrid)}
                                className={`${true ? 'bg-[#5d4037]' : 'bg-[#8b795e]'
                                    } text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2  rounded cursor-pointer flex items-center gap-2`}
                            >
                                <Grid size={16} />
                                {true ? 'Hide Grid' : 'Show Grid'}
                            </button>
                            <button
                                // onClick={handleGenerateTimelapse}
                                // disabled={isGeneratingTimelapse}
                                className="bg-[#003366] text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2  rounded cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            >
                                <Film size={16} />
                                {false ? 'Generating...' : 'Create Timelapse'}
                            </button>
                        </div>
                        {/* Canvas Container (Aapki CSS classes ke sath) */}
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
            <ContributionSidebar
                contributions={savedStrokes} // TODO: Isay proper contribution objects mein badalna hoga
                selectedContributionId={selectedContributionId}
                onContributionSelect={setSelectedContributionId}
                canvasStats={canvasStats}
                infoBoxData={{
                    strokeCount: savedStrokes.length,
                    isSaving: isSaving,
                    saveError: saveError
                }}
            />
        </div>
    );
};

export default ProjectPage;