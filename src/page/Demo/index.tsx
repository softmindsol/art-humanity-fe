import React, { useEffect, useCallback } from 'react';
import { Brush, Eraser, Move, Grid, Undo, Redo, Film } from 'lucide-react'; // Grid icon imported
import { useCanvasState } from '@/hook/useCanvasState';
import type { Position, Tile } from '@/types/canvas';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    selectCurrentBrush, selectCurrentCanvas, selectErrorForOperation, selectIsLoadingOperation, setBrushColor, setCanvasOffset, setZoomLevel, selectTimelapseUrl,
    clearTimelapseUrl,
} from '@/redux/slice/paintPixel';
import { createStroke, generateTimelapseVideo } from '@/redux/action/painPixel';


// --- CONSTANTS ---
const TILE_SIZE = 512; // Optimal tile size for performance
const VIEWPORT_WIDTH = 1024; // Fixed viewport width
const VIEWPORT_HEIGHT = 1024; // Fixed viewport height


const TiledCanvas: React.FC = () => {
    const dispatch = useDispatch();

    // --- REDUX STATE ---
    // Get state directly from the Redux store
    const brushState = useSelector(selectCurrentBrush);
    const canvasState = useSelector(selectCurrentCanvas);
    const isSaving = useSelector(selectIsLoadingOperation('createStroke'));
    const saveError = useSelector(selectErrorForOperation('createStroke'));
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const isGeneratingTimelapse = useSelector(selectIsLoadingOperation('generateTimelapse'));
    const timelapseError = useSelector(selectErrorForOperation('generateTimelapse'));
    const {
        isModalOpen, setIsModalOpen,
        // Refs
        containerRef,
        viewportCanvasRef,
        tilesRef,
        setCanvasState,
        setBrushState,
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
        setIsCanvasHovered,
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
        sessionId,
        canvasId,
        setCurrentPixelLog,
        strokeStartTime,
        setStrokeStartTime,
        // History
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
    } = useCanvasState();
    useEffect(() => {
        console.log("currentStrokePath:", currentStrokePath)
    }, [currentStrokePath])
    useEffect(() => {
        saveStateToHistory();
    }, []);

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


    const handleGenerateTimelapse = () => {
        if (!sessionId) {
            alert("Session ID is not available.");
            return;
        }
        console.log(`Requesting timelapse for session: ${sessionId}`);
        dispatch(generateTimelapseVideo({ sessionId }) as any);
    };
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
        ctx.fillStyle = '#f0f0f0';
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
        if (brushState.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)'; // Must be opaque for eraser to work
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;
        }
        ctx.lineWidth = brushState.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        tile.isDirty = true;
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        setIsDrawing(true);
        setLastPos(getMousePosInWorld(e));
        setCurrentPixelLog([]); // Clear pixel log for the new stroke
        setCurrentStrokePath([])
        setStrokeStartTime(new Date()); // Set start time
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        const pos = getMousePosInWorld(e);

        // **CHANGE**: Add the new segment to the stroke path state
        setCurrentStrokePath((prev: any) => [...prev, { fromX: lastPos.x, fromY: lastPos.y, toX: pos.x, toY: pos.y }]);

        // Draw visually on the canvas
        const fromCoords = worldToTileCoords(lastPos.x, lastPos.y);
        const toCoords = worldToTileCoords(pos.x, pos.y);
        const minTileX = Math.min(fromCoords.tileX, toCoords.tileX);
        const maxTileX = Math.max(fromCoords.tileX, toCoords.tileX);
        const minTileY = Math.min(fromCoords.tileY, toCoords.tileY);
        const maxTileY = Math.max(fromCoords.tileY, toCoords.tileY);
        for (let y = minTileY; y <= maxTileY; y++) {
            for (let x = minTileX; x <= maxTileX; x++) {
                const tile = getTile(x, y);
                drawOnTile(tile, lastPos.x - x * TILE_SIZE, lastPos.y - y * TILE_SIZE, pos.x - x * TILE_SIZE, pos.y - y * TILE_SIZE);
            }
        }
        setLastPos(pos);
        renderVisibleTiles();
    };

    const stopDrawing = async () => {
        if (!isDrawing || currentStrokePath.length === 0) { // **CHANGE**: Check stroke path
            setIsDrawing(false);
            return;
        }
        setIsDrawing(false);
        saveStateToHistory();

        // **THE FIX IS HERE**: Prepare payload with `strokePath` to match your backend
        const strokePayload = {
            canvasId: canvasId,
            canvasResolution: canvasState.resolution,
            canvasSize: TILE_SIZE,
            strokePath: currentStrokePath, // **CHANGE**: Send strokePath, not pixels
            brushSize: brushState.size,
            color: brushState.color,
            mode: brushState.mode,
            sessionId: sessionId,
            userId: null,
            zoomLevel: canvasState.zoomLevel,
            canvasOffset: canvasState.offset,
            strokeStartTime: strokeStartTime?.toISOString(),
            strokeEndTime: new Date().toISOString(),
        };

        console.log("Dispatching createStroke with payload:", strokePayload);
        dispatch(createStroke(strokePayload) as any);

        setCurrentStrokePath([]); // Clear path for the next stroke
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
        // setCanvasState({ zoomLevel: newZoom, offset: { x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom } });
        dispatch(setZoomLevel(newZoom));
        dispatch(setCanvasOffset({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom }));
    };

    const startPan = (e: React.MouseEvent) => {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasState.offset.x, y: e.clientY - canvasState.offset.y });
    };
    const pan = (e: React.MouseEvent) => {
        if (isPanning) setCanvasState(prev => ({ ...prev, offset: { x: e.clientX - panStart.x, y: e.clientY - panStart.y } }));
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
    const startToolboxDrag = (e: React.MouseEvent) => { e.stopPropagation(); setIsDraggingToolbox(true); setToolboxStart({ x: e.clientX - toolboxPos.x, y: e.clientY - toolboxPos.y }); };
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

    // Ab jab humein pata hai ke brushState maujood hai, to hum is variable ko safely bana sakte hain.
    const currentColorString = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;


    return (
        <div style={{ minHeight: '135vh', fontFamily: 'Georgia, serif', overflow: 'auto', position: 'relative' }}>
            <div className="mb-[150px] px-5 py-2 text-center">
                <h1 className="text-2xl text-[#5d4e37] mb-1 font-normal">Demo Canvas</h1>
                <p className="text-[#8b795e] italic mb-2">
                    Using {TILE_SIZE}px tiles. Zoom with wheel, pan with Move tool.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={loadReferenceImage}
                        className="bg-[#8b795e] text-white border-none px-4 py-2 rounded cursor-pointer"
                    >
                        Load Image
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        className="bg-[#cd5c5c] text-white border-none px-4 py-2 rounded cursor-pointer"
                    >
                        Clear Canvas
                    </button>

                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`${showGrid ? 'bg-[#5d4037]' : 'bg-[#8b795e]'
                            } text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2`}
                    >
                        <Grid size={16} />
                        {showGrid ? 'Hide Grid' : 'Show Grid'}
                    </button>
                    <button
                        onClick={handleGenerateTimelapse}
                        disabled={isGeneratingTimelapse}
                        className="bg-[#003366] text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                        <Film size={16} />
                        {isGeneratingTimelapse ? 'Generating...' : 'Create Timelapse'}
                    </button>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl bg-[#5d4037] border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle >
                            <p className='text-white'> Project Timelapse</p>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-4 min-h-[300px] flex items-center justify-center">

                        {/* CASE 1: Loading State */}
                        {isGeneratingTimelapse && (
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-blue-300">Generating your timelapse video...</p>
                                <p className="text-sm text-gray-400">This might take a few moments.</p>
                            </div>
                        )}

                        {/* CASE 2: Error State */}
                        {timelapseError && !isGeneratingTimelapse && (
                            <div className="text-center text-red-400">
                                <h3 className="text-xl font-bold mb-2">Error!</h3>
                                <p>Failed to generate the timelapse.</p>
                                <p className="text-xs text-gray-500 mt-1">{timelapseError}</p>
                            </div>
                        )}

                        {/* CASE 3: Success State (Video Ready) */}
                        {timelapseUrl && !isGeneratingTimelapse && (
                            <video
                                key={timelapseUrl} // Key add karne se URL change hone par video re-render hoti hai
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

            <div
                className="absolute bg-white border border-[#8b795e] rounded-lg p-4 min-w-[210px] shadow-lg z-[1000] select-none"
                style={{ left: toolboxPos.x, top: toolboxPos.y }}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300">
                    <h3 className="text-[#5d4e37] text-sm font-semibold m-0">Tools</h3>
                    <div
                        onMouseDown={startToolboxDrag}
                        className="cursor-grab p-1 text-[#8b795e]"
                        title="Drag Toolbox"
                    >
                        ⋮⋮
                    </div>
                </div>

                {/* Undo / Redo */}
                <div className="flex gap-2 justify-end mb-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        title="Undo (Ctrl+Z)"
                        className={`p-1 border border-[#8b795e] rounded text-[#8b795e] ${historyIndex <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f9f4f2]'
                            }`}
                    >
                        <Undo size={16} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        title="Redo (Ctrl+Y)"
                        className={`p-1 border border-[#8b795e] rounded text-[#8b795e] ${historyIndex >= history.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f9f4f2]'
                            }`}
                    >
                        <Redo size={16} />
                    </button>
                </div>

                {/* Brush / Eraser / Move */}
                <div className="flex gap-2 mb-5">
                    {['brush', 'eraser', 'move'].map((mode) => {
                        const Icon = mode === 'brush' ? Brush : mode === 'eraser' ? Eraser : Move;
                        const isActive = brushState.mode === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setBrushState((p) => ({ ...p, mode }))}
                                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                                className={`flex-1 p-1 border border-[#8b795e] rounded ${isActive ? 'bg-[#8b795e] text-white' : 'bg-transparent text-[#8b795e]'
                                    }`}
                            >
                                <Icon size={16} />
                            </button>
                        );
                    })}
                </div>

                {/* Color Picker Label */}
                <label className="text-sm font-bold text-[#5d4e37] mb-2 block">Color</label>

                {/* Color Wheel */}
                <div
                    className="relative w-[120px] h-[120px] mx-auto rounded-full cursor-pointer mb-3"
                    style={{
                        background:
                            'conic-gradient(hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))',
                    }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const angle = Math.atan2(
                            e.clientY - (rect.top + rect.height / 2),
                            e.clientX - (rect.left + rect.width / 2)
                        );
                        setHue(((angle * 180) / Math.PI + 360) % 360);
                    }}
                >
                    <div
                        className="absolute w-[30px] h-[30px] rounded-full border-4 border-white shadow"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: currentColorString,
                        }}
                    />
                </div>

                {/* Brush Size Slider */}
                <div className="mb-4 mt-4">
                    <label>Brush Size: {brushState.size}px</label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushState.size}
                        // onChange={(e) => dispatch(setBrushSize(Number(e.target.value)))}
                        className="w-full"
                    />
                </div>
            </div>


            <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }} onMouseEnter={() => setIsCanvasHovered(true)} onMouseLeave={() => setIsCanvasHovered(false)}>
                <canvas
                    ref={viewportCanvasRef}
                    width={VIEWPORT_WIDTH}
                    height={VIEWPORT_HEIGHT}
                    style={{
                        width: `${VIEWPORT_WIDTH}px`,
                        height: `${VIEWPORT_HEIGHT}px`,
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

            <div className="absolute bottom-16 right-10 bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723]">
                <div>Zoom: {Math.round(canvasState.zoomLevel * 100)}%</div>
                <div>World Pos: ({mousePos.x}, {mousePos.y})</div>
                <div>Tiles: {totalTiles}</div>
                <div>Strokes: {allStrokes.length}</div>
                {isSaving && <div className="text-orange-500">Saving...</div>}
                {saveError && <div className="text-[#cd5c5c]">{saveError}</div>}
            </div>

        </div>
    );
};

export default TiledCanvas;