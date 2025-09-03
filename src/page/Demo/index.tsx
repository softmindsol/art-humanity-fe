import React, { useEffect, useCallback, useRef } from 'react';
import { Brush, Eraser, Move, Grid, Undo, Redo } from 'lucide-react'; // Grid icon imported
import { useCanvasState } from '@/hook/useCanvasState';
import type { Position, Tile } from '@/types/canvas';
import {  useSelector } from 'react-redux';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,

} from "@/components/ui/dialog"
import {
    selectCurrentBrush, selectCurrentCanvas, selectErrorForOperation, selectIsLoadingOperation, setBrushColor, setCanvasOffset, setZoomLevel, selectTimelapseUrl,

    setBrushMode,
    setBrushSize,
    selectCanvasData,
} from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import Toolbox from '@/components/toolbox/Toolbox';


// --- CONSTANTS ---
const TILE_SIZE = 512; // Optimal tile size for performance
const VIEWPORT_WIDTH = 1024; // Fixed viewport width
const VIEWPORT_HEIGHT = 1024; // Fixed viewport height



const DemoCanvas: React.FC = () => {
    const dispatch = useAppDispatch();

    // --- REDUX STATE ---
    // Get state directly from the Redux store
    const brushState = useSelector(selectCurrentBrush);
    const canvasState = useSelector(selectCurrentCanvas);
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const {
        isModalOpen, setIsModalOpen,
        // Refs
        containerRef,
        viewportCanvasRef,
        tilesRef,
        // setCanvasState,
        // setBrushState,
        isDrawing,
        setIsDrawing,
        lastPos,
        setLastPos,
        mousePos,
        setMousePos,
        isPanning,
        setIsPanning,
        panStart,
        setPanStart,
        toolboxPos,
        setToolboxPos,
        isDraggingToolbox,
        setIsDraggingToolbox,
        toolboxStart,
        setToolboxStart,
        // setIsCanvasHovered,
        showGrid,
        setShowGrid,
        hue,
        setHue,
        saturation,
        lightness,
        allStrokes,
        currentStrokePath,
        setCurrentStrokePath,
        totalTiles,
        setTotalTiles,
        // sessionId,
        setStrokeStartTime,
        // History
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
    } = useCanvasState();

    const savedStrokes = useSelector(selectCanvasData);

    // useEffect(() => {
    //     console.log("currentStrokePath:", currentStrokePath)
    // }, [currentStrokePath])
    useEffect(() => {
        saveStateToHistory();
    }, []);


    useEffect(() => {
        // Yeh effect tab he chalega jab strokes fetch ho chuke honge
        if (savedStrokes && savedStrokes.length > 0) {
            console.log(`Rendering ${savedStrokes.length} saved strokes.`);

            // Ek ek karke har stroke ko canvas par dobara draw karein
            savedStrokes.forEach((stroke: any) => {
                if (!stroke.strokePath || stroke.strokePath.length === 0) return;

                // Har stroke ke har hisse (segment) ko draw karein
                stroke.strokePath.forEach((pathSegment: any) => {
                    const fromCoords = worldToTileCoords(pathSegment.fromX, pathSegment.fromY);
                    const toCoords = worldToTileCoords(pathSegment.toX, pathSegment.toY);

                    // Cross-tile drawing ko handle karein
                    for (let y = Math.min(fromCoords.tileY, toCoords.tileY); y <= Math.max(fromCoords.tileY, toCoords.tileY); y++) {
                        for (let x = Math.min(fromCoords.tileX, toCoords.tileX); x <= Math.max(fromCoords.tileX, toCoords.tileX); x++) {
                            const tile = getTile(x, y);



                            drawOnTile(tile, pathSegment.fromX - x * TILE_SIZE, pathSegment.fromY - y * TILE_SIZE, pathSegment.toX - x * TILE_SIZE, pathSegment.toY - y * TILE_SIZE);
                        }
                    }
                });
            });

            // Saari tiles draw hone ke baad, final viewport ko render karein
            renderVisibleTiles();
            // History ko is loaded state ke saath save karein
            saveStateToHistory();
        }
    }, [savedStrokes]); // Yeh effect tab chalega jab `savedStrokes` Redux se aayega


    // useEffect(() => {
    //     if (isCanvasHovered) {
    //         document.body.style.overflow = 'hidden';
    //     } else {
    //         document.body.style.overflow = '';
    //     }
    //     return () => { document.body.style.overflow = ''; };
    // }, [isCanvasHovered]);


    // --- HISTORY MANAGEMENT ---
    const saveStateToHistory = useCallback(() => {
        const snapshot = new Map();
        tilesRef.current.forEach((tile, key) => {
            snapshot.set(key, tile.context.getImageData(0, 0, TILE_SIZE, TILE_SIZE));
        });

        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, snapshot]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

    const restoreStateFromHistory = useCallback((index: number) => {
        if (index < 0 || index >= history.length) return;

        const snapshot = history[index];
        tilesRef.current.clear(); // Clear current tiles to handle undoing tile creation

        snapshot.forEach((imageData: any, key: any) => {
            const [tileX, tileY] = key.split(',').map(Number);
            const tile = getTile(tileX, tileY);
            tile.context.putImageData(imageData, 0, 0);
        });

        setHistoryIndex(index);
        renderVisibleTiles();
    }, [history]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            restoreStateFromHistory(historyIndex - 1);
        }
    }, [historyIndex, restoreStateFromHistory]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            restoreStateFromHistory(historyIndex + 1);
        }
    }, [historyIndex, history.length, restoreStateFromHistory]);


    // const handleGenerateTimelapse = () => {
    //     if (!sessionId) {
    //         alert("Session ID is not available.");
    //         return;
    //     }
    //     console.log(`Requesting timelapse for session: ${sessionId}`);
    //     dispatch(generateTimelapseVideo({ sessionId }) as any);
    // };
    // Keyboard Shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) { // metaKey for Command on Mac
                if (e.key === 'z') {
                    e.preventDefault();
                    handleUndo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    // --- TILE MANAGEMENT ---
    const getTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

    const worldToTileCoords = (worldX: number, worldY: number) => {
        return {
            tileX: Math.floor(worldX / TILE_SIZE),
            tileY: Math.floor(worldY / TILE_SIZE)
        };
    };

    const createTile = (tileX: any, tileY: any): Tile => {
        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        return { x: tileX, y: tileY, canvas, context, isDirty: true };
    };

    const getTile = (tileX: any, tileY: any): Tile => {
        const key = getTileKey(tileX, tileY);
        let tile = tilesRef.current.get(key);
        if (!tile) {
            tile = createTile(tileX, tileY);
            tilesRef.current.set(key, tile);
            setTotalTiles(tilesRef.current.size);
        }
        return tile;
    };

    // --- RENDERING LOGIC ---
    const renderVisibleTiles = useCallback(() => {
        const viewportCanvas = viewportCanvasRef.current;
        if (!viewportCanvas) return;
        const ctx = viewportCanvas.getContext('2d')!;
        ctx.save();
        ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        const { zoomLevel, offset } = canvasState;
        const worldLeft = -offset.x / zoomLevel;
        const worldTop = -offset.y / zoomLevel;
        const worldRight = worldLeft + VIEWPORT_WIDTH / zoomLevel;
        const worldBottom = worldTop + VIEWPORT_HEIGHT / zoomLevel;
        const startTileX = Math.floor(worldLeft / TILE_SIZE);
        const startTileY = Math.floor(worldTop / TILE_SIZE);
        const endTileX = Math.ceil(worldRight / TILE_SIZE);
        const endTileY = Math.ceil(worldBottom / TILE_SIZE);
        ctx.imageSmoothingEnabled = zoomLevel < 1;
        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = getTile(x, y);
                const viewX = (x * TILE_SIZE * zoomLevel) + offset.x;
                const viewY = (y * TILE_SIZE * zoomLevel) + offset.y;
                const viewWidth = TILE_SIZE * zoomLevel;
                const viewHeight = TILE_SIZE * zoomLevel;
                ctx.drawImage(tile.canvas, viewX, viewY, viewWidth, viewHeight);
                if (showGrid) {
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);
                }
            }
        }
        ctx.restore();
    }, [canvasState, showGrid]);

    useEffect(() => {
        renderVisibleTiles();
    }, [canvasState, renderVisibleTiles]);
    useEffect(() => {
        // Agar `timelapseUrl` mein koi value aayi hai (null nahi hai),
        // to modal ko open kar do.
        if (timelapseUrl) {
            setIsModalOpen(true);
        }
    }, [timelapseUrl]);
    // --- MOUSE AND DRAWING HANDLERS ---
    const getMousePosInWorld = (e: MouseEvent | React.MouseEvent): Position => {
        const viewport = viewportCanvasRef.current!;
        const rect = viewport.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - canvasState.offset.x) / canvasState.zoomLevel,
            y: (e.clientY - rect.top - canvasState.offset.y) / canvasState.zoomLevel
        };
    };



    const drawOnTile = (tile: any, fromX: any, fromY: any, toX: any, toY: any) => {
        const ctx = tile.context;

        // Common settings
        ctx.lineWidth = brushState.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);

        if (brushState.mode === 'eraser') {

            // Step 1: Pehle, purani drawing ke PEECHE ek safed line draw karo.
            // Isse jab aage se drawing mitegi, to peeche safed color dikhega.
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = '#ffffff'; // Background color
            ctx.stroke(); // Yahan stroke() call karna zaroori hai

            // Step 2: Ab, purani drawing ke UPAR se pixels ko mitao.
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)'; // Koi bhi opaque color
            ctx.stroke(); // Yahan dobara stroke() call karna zaroori hai

        } else {
            // Brush ka logic same rahega
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;
            ctx.stroke();
        }

        tile.isDirty = true;
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        setIsDrawing(true);
        setLastPos(getMousePosInWorld(e));
        setCurrentStrokePath([]);
        setStrokeStartTime(new Date());
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        const pos = getMousePosInWorld(e);
        setCurrentStrokePath((prev: any) => [...prev, { fromX: lastPos.x, fromY: lastPos.y, toX: pos.x, toY: pos.y }]);
        // ... (visual drawing logic)
        const fromCoords = worldToTileCoords(lastPos.x, lastPos.y);
        const toCoords = worldToTileCoords(pos.x, pos.y);
        for (let y = Math.min(fromCoords.tileY, toCoords.tileY); y <= Math.max(fromCoords.tileY, toCoords.tileY); y++) {
            for (let x = Math.min(fromCoords.tileX, toCoords.tileX); x <= Math.max(fromCoords.tileX, toCoords.tileX); x++) {
                const tile = getTile(x, y);
                drawOnTile(tile, lastPos.x - x * TILE_SIZE, lastPos.y - y * TILE_SIZE, pos.x - x * TILE_SIZE, pos.y - y * TILE_SIZE);
            }
        }
        setLastPos(pos);
        renderVisibleTiles();
    };

    const stopDrawing = async () => {
        if (!isDrawing || currentStrokePath.length === 0) { setIsDrawing(false); return; }
        setIsDrawing(false);
        saveStateToHistory();
        // const strokePayload = { canvasId, canvasResolution: canvasState.resolution, canvasSize: TILE_SIZE, strokePath: currentStrokePath, brushSize: brushState.size, color: brushState.color, mode: brushState.mode, sessionId, userId: null, zoomLevel: canvasState.zoomLevel, canvasOffset: canvasState.offset, strokeStartTime: strokeStartTime?.toISOString(), strokeEndTime: new Date().toISOString() };
        // dispatch(createStroke(strokePayload) as any);
        setCurrentStrokePath([]);
    };


    // --- PAN AND ZOOM HANDLERS ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newZoom = Math.min(Math.max(canvasState.zoomLevel * zoomFactor, 0.05), 4);
        const worldX = (mouseX - canvasState.offset.x) / canvasState.zoomLevel;
        const worldY = (mouseY - canvasState.offset.y) / canvasState.zoomLevel;
        dispatch(setZoomLevel(newZoom));
        dispatch(setCanvasOffset({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom }));
    };

    const startPan = (e: React.MouseEvent) => { setIsPanning(true); setPanStart({ x: e.clientX - canvasState.offset.x, y: e.clientY - canvasState.offset.y }); };
    const pan = (e: React.MouseEvent) => {
        if (isPanning) {
            dispatch(setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
        }
    };
    const stopPan = () => setIsPanning(false);

    // --- OTHER ACTIONS ---
    const handleClearCanvas = () => {
        tilesRef.current.forEach(tile => {
            tile.context.fillStyle = '#ffffff';
            tile.context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.isDirty = true;
        });
        renderVisibleTiles();
        saveStateToHistory();
    };


    const loadReferenceImage = () => {
        const tile = getTile(0, 0);
        const ctx = tile.context;
        ctx.save();
        const scale = 0.5, offsetX = 60, offsetY = 80;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(100 * scale + offsetX, 150 * scale + offsetY, 80 * scale, 60 * scale);
        ctx.fillStyle = '#CD5C5C';
        ctx.beginPath();
        ctx.moveTo(90 * scale + offsetX, 150 * scale + offsetY);
        ctx.lineTo(140 * scale + offsetX, 120 * scale + offsetY);
        ctx.lineTo(190 * scale + offsetX, 150 * scale + offsetY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        tile.isDirty = true;
        renderVisibleTiles();
    };

    // --- TOOLBOX DRAG LOGIC ---
    const dragToolbox = useCallback((e: MouseEvent) => { if (isDraggingToolbox) setToolboxPos({ x: e.clientX - toolboxStart.x, y: e.clientY - toolboxStart.y }); }, [isDraggingToolbox, toolboxStart]);
    const stopToolboxDrag = useCallback(() => setIsDraggingToolbox(false), []);

    useEffect(() => {
        if (isDraggingToolbox) {
            document.addEventListener('mousemove', dragToolbox);
            document.addEventListener('mouseup', stopToolboxDrag);
        }
        return () => {
            document.removeEventListener('mousemove', dragToolbox);
            document.removeEventListener('mouseup', stopToolboxDrag);
        };
    }, [isDraggingToolbox, dragToolbox, stopToolboxDrag]);

    // --- COLOR CONVERSION ---
    useEffect(() => {
        const hslToRgb = (h: number, s: number, l: number) => {
            s /= 100; l /= 100;
            const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
            else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
            return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
        };
        // setBrushState(prev => ({ ...prev, color: hslToRgb(hue, saturation, lightness) }));
        dispatch(setBrushColor(hslToRgb(hue, saturation, lightness)));
    }, [hue, saturation, lightness]);

    if (!brushState || !canvasState) {
        return <div>Loading Canvas...</div>;
    }

    return (
        <div ref={mainContentRef} className='h-[100vh] md:h-[155vh] lg:!h-[145vh] xl:!h-[145vh] 2xl:h-[135vh]' style={{ fontFamily: 'Georgia, serif', overflow: 'auto', position: 'relative' }}>
            <div className=" md:mb-[190px] 3xl:mb-[150px] px-5 py-2 text-center">
                <h1 className="text-2xl md:text-[40px] text-[#5d4e37] mb-1 font-normal">Demo Canvas</h1>
                <p className="text-[#8b795e] italic mb-2">
                    Using {TILE_SIZE}px tiles. Zoom with wheel, pan with Move tool.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={loadReferenceImage}
                        className="bg-[#8b795e] text-[14px] lg:text-[16px] text-white border-none px-4 py-2 rounded cursor-pointer"
                    >
                        Load Image
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        className="bg-[#cd5c5c] text-white text-[14px] lg:text-[16px] border-none px-4 py-2 rounded cursor-pointer"
                    >
                        Clear Canvas
                    </button>

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`${showGrid ? 'bg-[#5d4037]' : 'bg-[#8b795e]'
                            } text-white border-none px-4 py-2 text-[14px] lg:text-[16px] rounded cursor-pointer flex items-center gap-2`}
                    >
                        <Grid size={16} />
                        {showGrid ? 'Hide Grid' : 'Show Grid'}
                    </button>
                    {/* <button
                        onClick={handleGenerateTimelapse}
                        disabled={isGeneratingTimelapse}
                        className="bg-[#003366] text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                        <Film size={16} />
                        {isGeneratingTimelapse ? 'Generating...' : 'Create Timelapse'}
                    </button> */}
                </div>
            </div>

          
            
            <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}>
                <canvas
                    ref={viewportCanvasRef}
                    width={VIEWPORT_WIDTH}
                    height={VIEWPORT_HEIGHT}
                    className=' w-[95%] md:w-[90%] md:h-[1024px]  xl:w-[1024px] xl:h-[1024px] relative'
                    style={{
                        // width: `${VIEWPORT_WIDTH}px`,
                        // height: `${VIEWPORT_HEIGHT}px`,
                        border: '4px solid #4d2d2d',
                        cursor: brushState.mode === 'move' ? (isPanning ? 'grabbing' : 'grab') : (canvasState.zoomLevel < 1 ? 'not-allowed' : 'crosshair'),
                    }}
                    onWheel={handleWheel}
                    onMouseDown={(e) => { if (e.button === 2 || brushState.mode === 'move') startPan(e); else startDrawing(e); }}
                    onMouseMove={(e) => {
                        const pos = getMousePosInWorld(e);
                        setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
                        if (isPanning) pan(e); else if (isDrawing) draw(e);
                    }}
                    onMouseUp={() => { stopDrawing(); stopPan(); }}
                    onMouseLeave={() => { stopDrawing(); stopPan(); }}
                    onContextMenu={(e) => e.preventDefault()}
                />
            </div>

            <Toolbox boundaryRef={mainContentRef} />

        </div>
    );
};

export default DemoCanvas;