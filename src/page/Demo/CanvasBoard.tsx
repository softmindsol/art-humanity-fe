import React, { useEffect, useCallback, useRef, useState } from 'react';
import {  List } from 'lucide-react';
import { useCanvasState } from '@/hook/useCanvasState';
import type { Position, Tile } from '@/types/canvas';
import { useSelector } from 'react-redux';

import {
    selectCurrentBrush, selectCurrentCanvas, setCanvasOffset, setZoomLevel, selectTimelapseUrl} from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import Toolbox from '@/components/toolbox/ToolboxInfo';
import { useMediaQuery } from '@/hook/useMediaQuery';

// --- CONSTANTS ---
const TILE_SIZE = 512;
const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 1024;
const MIN_ZOOM_LEVEL = 1.0; // <-- ZOOMLIMIT: 100% se kam nahi hoga
const MAX_ZOOM_LEVEL = 4.0;
const styles = `
    .canvas-container {
        font-family: 'Georgia, serif';
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow-x: hidden; 
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
        flex-wrap: wrap; 
        justify-content: center;
        gap: 0.75rem; /* 12px */
    }

    .control-button {
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: background-color 0.2s;
    }

    .canvas-viewport-wrapper {
        width: 100%;
        max-width: ${VIEWPORT_WIDTH}px;
        margin: auto;
        position: relative; 
    }

    #viewport-canvas {
        width: 100%;
        height: auto;
        border: 4px solid #4d2d2d;
        display: block;
    }
    
    /* InfoBox Style */
    .zoom-info-box { 
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.8rem;
        z-index: 10;
    }

    /* Media Queries for different screen sizes */
    @media (min-width: 768px) { 
        .canvas-title {
            font-size: 2.5rem; 
        }
        .control-button {
            font-size: 1rem; 
        }
    }
`;

const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c, b = x; } else if (h < 240) { g = x, b = c; }
    else if (h < 300) { r = x, b = c; } else { r = c, b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
};


const CanvasBoard: React.FC = () => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const canvasState = useSelector(selectCurrentCanvas);
    const timelapseUrl = useSelector(selectTimelapseUrl);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const {
        setIsModalOpen,
        viewportCanvasRef,
        tilesRef,
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
        showGrid,
        setShowGrid,
        hue,
        saturation,
        lightness,
        currentStrokePath,
        setCurrentStrokePath,
        setTotalTiles,
        setStrokeStartTime,
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
    } = useCanvasState();

    const [lineStartPos, setLineStartPos] = useState<Position | null>(null);
    const brushStateRef = useRef(brushState);
    useEffect(() => {
        brushStateRef.current = brushState;
    }, [brushState]);



    useEffect(() => { saveStateToHistory(); }, []);



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

        if (brushState.mode === 'line' && isDrawing && lineStartPos) {
            ctx.beginPath();
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
    }, [canvasState, showGrid, isDrawing, lineStartPos, mousePos, brushState, viewportCanvasRef, getTile]);

    useEffect(() => { renderVisibleTiles(); }, [canvasState, renderVisibleTiles]);
    useEffect(() => { if (timelapseUrl) setIsModalOpen(true); }, [timelapseUrl]);


    const getMousePosInWorld = (e: MouseEvent | React.MouseEvent): Position => {
        const viewport = viewportCanvasRef.current!;
        const rect = viewport.getBoundingClientRect(); // Yeh humein display size dega

        // Step 1: Click ki position display size ke hisab se nikalein (0 se 1 ke darmiyan)
        const mouseX_ratio = (e.clientX - rect.left) / rect.width;
        const mouseY_ratio = (e.clientY - rect.top) / rect.height;

        // Step 2: Is ratio ko canvas ke asal size se multiply karke sahi pixel coordinate nikalein
        const mouseX_on_canvas = mouseX_ratio * viewport.width; // viewport.width yahan 1024 hai
        const mouseY_on_canvas = mouseY_ratio * viewport.height; // viewport.height yahan 1024 hai

        // Step 3: Ab in sahi coordinates ko world position mein convert karein
        return {
            x: (mouseX_on_canvas - canvasState.offset.x) / canvasState.zoomLevel, // <-- YAHAN PAR TYPO THEEK KI GAYI HAI
            y: (mouseY_on_canvas - canvasState.offset.y) / canvasState.zoomLevel, // <-- YAHAN PAR TYPO THEEK KI GAYI HAI
        };
    };

    const drawOnTile = (tile: any, fromX: any, fromY: any, toX: any, toY: any) => {
        const currentBrush = brushStateRef.current;
        const ctx = tile.context;
        ctx.lineWidth = brushState.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);

        if (brushState.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.stroke();
        } else {
            const { h, s, l } = brushState.color;

            // 2. Usay foran RGB mein convert karein
            // Agar color pehle se RGB hai to usay waise hi rehne dein
            const finalColor = (h !== undefined)
                ? hslToRgb(h, s, l)
                : brushState.color;

            // 3. Sahi RGB color istemal karein
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(${finalColor.r}, ${finalColor.g}, ${finalColor.b}, ${finalColor.a || 1})`;
            ctx.stroke();
        }
        tile.isDirty = true;
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (brushState.mode === 'line') {
            const pos = getMousePosInWorld(e);
            setLineStartPos(pos);
            setIsDrawing(true);
            return;
        }
        if (brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        setIsDrawing(true);
        setLastPos(getMousePosInWorld(e));
        setCurrentStrokePath([]);
        setStrokeStartTime(new Date());
    };

    const draw = (e: React.MouseEvent) => {
        if (brushState.mode === 'line' && isDrawing) {
            renderVisibleTiles();
            return;
        }
        if (!isDrawing || brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        const pos = getMousePosInWorld(e);
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
    const saveStateToHistory = useCallback(() => {
        const snapshot = new Map();
        tilesRef.current.forEach((tile, key) => {
            snapshot.set(key, tile.context.getImageData(0, 0, TILE_SIZE, TILE_SIZE));
        });
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, snapshot]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex, tilesRef, setHistory, setHistoryIndex]);

    const restoreStateFromHistory = useCallback((index: number) => {
        if (index < 0 || index >= history.length) return;
        const snapshot = history[index];
        tilesRef.current.clear();
        snapshot.forEach((imageData: any, key: any) => {
            const [tileX, tileY] = key.split(',').map(Number);
            const tile = getTile(tileX, tileY);
            tile.context.putImageData(imageData, 0, 0);
        });
        setHistoryIndex(index);
        renderVisibleTiles();
    }, [history, tilesRef, setHistoryIndex, renderVisibleTiles, getTile]);
 

    const stopDrawing = async () => {
        if (brushState.mode === 'line' && isDrawing && lineStartPos) {
            const endPos = mousePos;
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

            setIsDrawing(false);
            setLineStartPos(null);
            return;
        }

        if (!isDrawing || currentStrokePath.length === 0) { setIsDrawing(false); return; }
        setIsDrawing(false);
        saveStateToHistory();
        setCurrentStrokePath([]);
    };


    // --- PAN AND ZOOM HANDLERS ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

        let newZoom = canvasState.zoomLevel * zoomFactor;

        // **ZOOMLIMIT (100% se kam nahi)**
        newZoom = Math.min(Math.max(newZoom, MIN_ZOOM_LEVEL), MAX_ZOOM_LEVEL);

        const worldX = (mouseX - canvasState.offset.x) / canvasState.zoomLevel;
        const worldY = (mouseY - canvasState.offset.y) / canvasState.zoomLevel;
        dispatch(setZoomLevel(newZoom));
        dispatch(setCanvasOffset({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom }));
    };


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
        // Agar Toolbox Drag ho raha hai, to canvas interaction ko rok dein
        if (isDraggingToolbox) return;

        if (e.button === 2) { // Right click -> pan
            setIsPanning(true);
            setPanStart({ x: e.clientX - canvasState.offset.x, y: e.clientY - canvasState.offset.y });
        } else if (e.button === 0) startDrawing(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Agar Toolbox Drag ho raha hai, to canvas interaction ko rok dein
        if (isDraggingToolbox) return;

        const pos = getMousePosInWorld(e);
        setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
        if (isPanning) {
            dispatch(setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
        } else if (isDrawing) draw(e);
    };

    const handleMouseUp = () => {
        // Agar Toolbox Drag ho raha hai, to canvas interaction ko rok dein
        if (isDraggingToolbox) return;

        if (isPanning) setIsPanning(false);
        if (isDrawing) stopDrawing();
    };

    // <-- Canvas Hover Effects (Overflow Hidden) -->
    const handleCanvasMouseEnter = () => {
        document.body.style.overflow = 'hidden';
    };

    const handleCanvasMouseLeave = () => {
        document.body.style.overflow = 'auto';
        if (isPanning) setIsPanning(false);
        if (isDrawing) stopDrawing();
    };


    // --- TOOLBOX DRAG LOGIC (Already present, ensuring dependencies) ---
    const dragToolbox = useCallback((e: MouseEvent) => {
        if (isDraggingToolbox) {
            setToolboxPos({ x: e.clientX - toolboxStart.x, y: e.clientY - toolboxStart.y });
        }
    }, [isDraggingToolbox, toolboxStart, setToolboxPos]);

    const stopToolboxDrag = useCallback(() => {
        setIsDraggingToolbox(false);
    }, [setIsDraggingToolbox]);

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
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

    // <-- Canvas Hover Effects Setup -->
    useEffect(() => {
        const canvasElement = viewportCanvasRef.current;
        if (canvasElement) {
            canvasElement.addEventListener('mouseenter', handleCanvasMouseEnter);
            canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
        }
        return () => {
            if (canvasElement) {
                canvasElement.removeEventListener('mouseenter', handleCanvasMouseEnter);
                canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
            }
        };
    }, [viewportCanvasRef.current, isDrawing, isPanning]);

    useEffect(() => {
        const canvasElement = viewportCanvasRef.current;
        if (!canvasElement) return;

        const preventDefault = (e: Event) => e.preventDefault();

        const handleMouseEnter = () => {
            document.body.style.overflow = 'hidden';
            // Wheel event ko capture karke rokein taake page scroll na ho
            // 'passive: false' zaroori hai taake preventDefault() kaam kare
            window.addEventListener('wheel', preventDefault, { passive: false });
        };

        const handleMouseLeave = () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('wheel', preventDefault);
        };

        canvasElement.addEventListener('mouseenter', handleMouseEnter);
        canvasElement.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup: Component unmount hone par listeners aur style ko reset karein
        return () => {
            canvasElement.removeEventListener('mouseenter', handleMouseEnter);
            canvasElement.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('wheel', preventDefault);
            document.body.style.overflow = 'auto';
        };
    }, []); // Sirf ek baar chalayei
    if (!brushState || !canvasState) {
        return <div>Loading Canvas...</div>;
    }

    return (
        <>
            <style>{styles}</style>
            <div ref={mainContentRef} className="canvas-container !mt-20">
                <div className="canvas-header">
                  

                    <div className="canvas-controls">
                      
                        <button
                            onClick={handleClearCanvas}
                            className="control-button"
                            style={{ backgroundColor: '#BE0000', color: 'white' }}
                        >
                            Clear Canvas
                        </button>
                    </div>
                </div>

                <div className="canvas-viewport-wrapper justify-center bg-[#0F0D0D] p-16 items-center rounded-[12px] flex">
                    <canvas
                        className='w-[90%] xl:w-[95%] justify-center items-center flex'
                        ref={viewportCanvasRef}
                        width={VIEWPORT_WIDTH}
                        height={VIEWPORT_HEIGHT}
                        style={{
                            cursor: isPanning ? 'grabbing' : brushState.mode === 'move' ? 'grab' : 'crosshair',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            maxWidth: '100%', // Responsive banayein
                            maxHeight: '100%', // Responsive banayein
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseEnter={handleCanvasMouseEnter}
                        onWheel={handleWheel}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                </div>

                {/* InfoBox Integration */}
                <InfoBox
                    zoom={canvasState.zoomLevel}
                    worldPos={mousePos}
                    boundaryRef={mainContentRef}
                />

                <Toolbox boundaryRef={mainContentRef} />
            </div>
        </>
    );
};

const InfoBox = ({ zoom, worldPos, boundaryRef }: any) => {
    const isSmallScreen = useMediaQuery(1440);
    const [isMinimized, setIsMinimized] = useState(isSmallScreen);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const infoBoxRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setIsMinimized(isSmallScreen);
    }, [isSmallScreen]);

    // Initial/Programmatic positioning
    useEffect(() => {
        if (boundaryRef.current && infoBoxRef.current) {
            const boundaryRect = boundaryRef.current.getBoundingClientRect();

            const timeoutId = setTimeout(() => {
                if (!infoBoxRef.current) return;
                const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
                let newX, newY;

                if (isMinimized) {
                    newX = boundaryRect.width - infoBoxRect.width - 20;
                    newY = 20;
                } else {
                    if (isSmallScreen) {
                        newX = 20;
                        newY = boundaryRect.height - infoBoxRect.height - 20;
                    } else {
                        newX = 200;
                        newY = 0;
                    }
                }
                setPosition({ x: newX, y: newY });
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [boundaryRef, isSmallScreen, isMinimized]);


    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        if (!infoBoxRef.current || e.button !== 0) return;

        const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
        setIsDragging(true);

        dragOffsetRef.current = {
            x: e.clientX - infoBoxRect.left,
            y: e.clientY - infoBoxRect.top,
        };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boundaryRef.current || !infoBoxRef.current) return;

            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxNode = infoBoxRef.current;

            const newX_viewport = e.clientX - dragOffsetRef.current.x;
            const newY_viewport = e.clientY - dragOffsetRef.current.y;

            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;

            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - infoBoxNode.offsetWidth);
            newY = Math.min(newY, boundaryRect.height - infoBoxNode.offsetHeight);

            setPosition({ x: newX, y: newY });
        };

        const handleDragMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleDragMouseMove);
            document.addEventListener('mouseup', handleDragMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging, boundaryRef]);

    return (
        <div
            ref={infoBoxRef}
            className="absolute bg-[#0F0D0D] px-3 py-2 !w-[300px] rounded-xl border border-white/10 shadow-2xl select-none z-50 backdrop-blur-sm"
            style={{
                top: position.y,
                left: position.x,
                width: isMinimized ? 'auto' : 'auto',
                minWidth: '300px',
                transition: isDragging ? 'none' : 'top 0.3s ease-in-out, left 0.3s ease-in-out',
            }}
        >
            <div
                className="w-full flex items-center gap-2 mb-3 cursor-move"
                onMouseDown={handleDragMouseDown}
            >
                <List size={18} className="!text-white" />
                <p className="!text-white text-base font-medium m-0 whitespace-nowrap tracking-wide">InfoBox</p>
            </div>


            <div className='flex items-center justify-between text-base !text-white'>
                <div className="flex items-center gap-1">
                    <span className="text-white">Zoom:</span>
                    <span className="text-white font-medium">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-1">
                     <span className="text-white">World Pos:</span>
                     <span className="text-white font-medium">({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</span>
                </div>
                 
            </div>

        </div>
    );
};

export default CanvasBoard;