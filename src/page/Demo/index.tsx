import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Grid } from 'lucide-react'; // Grid icon imported
import { useCanvasState } from '@/hook/useCanvasState';
import type { Position, Tile } from '@/types/canvas';
import { useSelector } from 'react-redux';

import {
    selectCurrentBrush, selectCurrentCanvas, setBrushColor, setCanvasOffset, setZoomLevel, selectTimelapseUrl,

    selectCanvasData,
} from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import Toolbox from '@/components/toolbox/Toolbox';


// --- CONSTANTS ---
const TILE_SIZE = 512; // Optimal tile size for performance
const VIEWPORT_WIDTH = 1024; // Fixed viewport width
const VIEWPORT_HEIGHT = 1024; // Fixed viewport height
const styles = `
    .canvas-container {
        font-family: 'Georgia, serif';
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow-x: hidden; /* Prevent horizontal scroll */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        box-sizing: border-box;
    }

    .canvas-header {
        text-align: center;
        margin-bottom: 1.5rem;
        width: 100%;
    }

    .canvas-title {
        font-size: 1.75rem; /* 28px */
        color: #5d4e37;
        margin-bottom: 0.25rem;
        font-weight: normal;
    }

    .canvas-subtitle {
        color: #8b795e;
        font-style: italic;
        margin-bottom: 1rem;
    }

    .canvas-controls {
        display: flex;
        flex-wrap: wrap; /* Allow buttons to wrap on small screens */
        justify-content: center;
        gap: 0.75rem; /* 12px */
    }

    .control-button {
        border: none;
        padding: 0.5rem 1rem; /* 8px 16px */
        border-radius: 0.25rem; /* 4px */
        cursor: pointer;
        font-size: 0.875rem; /* 14px */
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: background-color 0.2s;
    }

    .canvas-viewport-wrapper {
        width: 100%;
        max-width: ${VIEWPORT_WIDTH}px; /* Canvas won't exceed its drawing size */
        margin: auto; /* Center the canvas */
    }

    #viewport-canvas {
        width: 100%;
        height: auto; /* Maintain aspect ratio */
        border: 4px solid #4d2d2d;
        display: block; /* Remove extra space below canvas */
    }

    /* Media Queries for different screen sizes */
    @media (min-width: 768px) { /* md breakpoint */
        .canvas-title {
            font-size: 2.5rem; /* 40px */
        }
        .control-button {
            font-size: 1rem; /* 16px */
        }
    }
`;


const DemoCanvas: React.FC = () => {
    const dispatch = useAppDispatch();

    // --- REDUX STATE ---
    // Get state directly from the Redux store
    const brushState = useSelector(selectCurrentBrush);
    const canvasState = useSelector(selectCurrentCanvas);
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const {
        setIsModalOpen,
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
        setToolboxPos,
        isDraggingToolbox,
        setIsDraggingToolbox,
        toolboxStart,
        // setIsCanvasHovered,
        showGrid,
        setShowGrid,
        hue,
        saturation,
        lightness,
        currentStrokePath,
        setCurrentStrokePath,
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
    // ===== YEH NAYI STATES ADD KAREIN =====
    const [lineStartPos, setLineStartPos] = useState<Position | null>(null);
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


    const renderVisibleTiles = useCallback(() => {
        const viewportCanvas = viewportCanvasRef.current;
        if (!viewportCanvas) return;
        const ctx = viewportCanvas.getContext('2d')!;
        ctx.save();
        // ... (baqi tile rendering ki logic waisi hi rahegi) ...
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

        // ===== YEH NAYA CODE ADD KIYA GAYA HAI =====
        // Agar line tool active hai aur drag ho raha hai, to preview dikhayein
        if (brushState.mode === 'line' && isDrawing && lineStartPos) {
            ctx.beginPath();
            // World coordinates ko viewport coordinates mein convert karein
            const startX = (lineStartPos.x * zoomLevel) + offset.x;
            const startY = (lineStartPos.y * zoomLevel) + offset.y;
            const endX = (mousePos.x * zoomLevel) + offset.x;
            const endY = (mousePos.y * zoomLevel) + offset.y;

            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;
            ctx.lineWidth = brushState.size;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        ctx.restore();
    }, [canvasState, showGrid, isDrawing, lineStartPos, mousePos, brushState]); // <-- Dependencies update karein

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
        // Agar line tool active hai
        if (brushState.mode === 'line') {
            const pos = getMousePosInWorld(e);
            setLineStartPos(pos); // Sirf line ka start point save karein
            setIsDrawing(true); // Drawing shuru karein
            return; // Brush wali logic ko rokein
        }

        // Baqi tools ke liye purani logic
        if (brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        setIsDrawing(true);
        setLastPos(getMousePosInWorld(e));
        setCurrentStrokePath([]);
        setStrokeStartTime(new Date());
    };

    const draw = (e: React.MouseEvent) => {
        // Agar line tool active hai aur drawing ho rahi hai
        if (brushState.mode === 'line' && isDrawing) {
            // Har mouse move par poora canvas dobara render karein
            // taake humein live preview dikhe
            renderVisibleTiles();
            return; // Brush wali logic ko rokein
        }

        // Baqi tools ke liye purani logic
        if (!isDrawing || brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        const pos = getMousePosInWorld(e);
        // ... baqi freehand drawing ki logic ...
        setCurrentStrokePath((prev: any) => [...prev, { fromX: lastPos.x, fromY: lastPos.y, toX: pos.x, toY: pos.y }]);
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
        // Agar line tool active tha
        if (brushState.mode === 'line' && isDrawing && lineStartPos) {
            // Mouse chhorne par line ko permanent draw karein
            const endPos = mousePos; // Current mouse position
            const fromCoords = worldToTileCoords(lineStartPos.x, lineStartPos.y);
            const toCoords = worldToTileCoords(endPos.x, endPos.y);

            for (let y = Math.min(fromCoords.tileY, toCoords.tileY); y <= Math.max(fromCoords.tileY, toCoords.tileY); y++) {
                for (let x = Math.min(fromCoords.tileX, toCoords.tileX); x <= Math.max(fromCoords.tileX, toCoords.tileX); x++) {
                    const tile = getTile(x, y);
                    drawOnTile(tile, lineStartPos.x - x * TILE_SIZE, lineStartPos.y - y * TILE_SIZE, endPos.x - x * TILE_SIZE, endPos.y - y * TILE_SIZE);
                }
            }
            renderVisibleTiles();
            saveStateToHistory();

            // States ko reset karein
            setIsDrawing(false);
            setLineStartPos(null);
            return; // Brush wali logic ko rokein
        }

        // Baqi tools ke liye purani logic
        if (!isDrawing || currentStrokePath.length === 0) { setIsDrawing(false); return; }
        setIsDrawing(false);
        saveStateToHistory();
        // ... stroke save karne ki logic ...
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

    // ----- Pan Handlers -----
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 2) { // Right click -> pan
            setIsPanning(true);
            setPanStart({ x: e.clientX - canvasState.offset.x, y: e.clientY - canvasState.offset.y });
        } else if (e.button === 0) startDrawing(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePosInWorld(e);
        setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
        if (isPanning) {
            dispatch(setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
        } else if (isDrawing) draw(e);
    };

    const handleMouseUp = () => { if (isPanning) setIsPanning(false); if (isDrawing) stopDrawing(); };


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
        <>
            <style>{styles}</style>
            <div ref={mainContentRef} className="canvas-container">
                <div className="canvas-header">
                    <h1 className="text-2xl md:text-[40px] text-[#5d4e37] mb-1 font-normal">Demo Canvas</h1>
                    <p className="canvas-subtitle">
                        Using {TILE_SIZE}px tiles. Zoom with wheel, pan with Move tool.
                    </p>

                    <div className="canvas-controls">
                        <button
                            onClick={loadReferenceImage}
                            className="control-button"
                            style={{ backgroundColor: '#8b795e', color: 'white' }}
                        >
                            Load Image
                        </button>

                        <button
                            onClick={handleClearCanvas}
                            className="control-button"
                            style={{ backgroundColor: '#cd5c5c', color: 'white' }}
                        >
                            Clear Canvas
                        </button>

                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className="control-button"
                            style={{
                                backgroundColor: showGrid ? '#5d4037' : '#8b795e',
                                color: 'white'
                            }}
                        >
                            <Grid size={16} />
                            {showGrid ? 'Hide Grid' : 'Show Grid'}
                        </button>
                    </div>
                </div>

                <div className="canvas-viewport-wrapper">
                    <canvas
                        ref={viewportCanvasRef}
                        width={VIEWPORT_WIDTH}
                        height={VIEWPORT_HEIGHT}
                        style={{
                            cursor: isPanning ? 'grabbing' : 'crosshair',
                            border: '4px solid #4d2d2d', // <-- Add border here
                            borderRadius: '4px', // optional: thoda rounded corner
                            backgroundColor: '#ffffff', // optional: white background
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                </div>

                <Toolbox boundaryRef={mainContentRef} />
            </div>
        </>
    );
};

export default DemoCanvas;

