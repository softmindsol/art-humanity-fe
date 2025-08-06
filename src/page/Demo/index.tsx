import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Brush, Eraser, Move } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Position {
    x: number;
    y: number;
}

interface RgbaColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface StrokeData {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

interface BrushState {
    mode: 'brush' | 'eraser' | 'move';
    size: number;
    color: RgbaColor;
}

interface CanvasState {
    zoomLevel: number;
    offset: Position;
}

interface Tile {
    x: number;
    y: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    isDirty: boolean;
}

// --- CONSTANTS ---
const TILE_SIZE = 256; // Optimal tile size for performance
const VIEWPORT_WIDTH = 1024; // Fixed viewport width
const VIEWPORT_HEIGHT = 1024; // Fixed viewport height


const TiledCanvas: React.FC = () => {
    // --- REFS ---
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const tilesRef = useRef<Map<string, Tile>>(new Map());

    // --- STATE MANAGEMENT ---
    const [canvasState, setCanvasState] = useState<CanvasState>({ zoomLevel: 1, offset: { x: 0, y: 0 } });
    const [brushState, setBrushState] = useState<BrushState>({ mode: 'brush', size: 5, color: { r: 0, g: 0, b: 0, a: 1 } });
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<Position>({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
    const [toolboxPos, setToolboxPos] = useState<Position>({ x: 20, y: 172 });
    const [isDraggingToolbox, setIsDraggingToolbox] = useState(false);
    const [toolboxStart, setToolboxStart] = useState<Position>({ x: 0, y: 0 });
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [allStrokes, setAllStrokes] = useState<any[]>([]);
    const [currentStrokePath, setCurrentStrokePath] = useState<StrokeData[]>([]);
    const [totalTiles, setTotalTiles] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string>('');
    const [sessionId, setSessionId] = useState('');
    const [canvasId, setCanvasId] = useState('');

    // --- INITIALIZATION ---
    useEffect(() => {
        setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        setCanvasId(`canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    }, []);

    // --- PAGE SCROLL LOCK ---
    useEffect(() => {
        if (isCanvasHovered) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCanvasHovered]);

    // --- TILE MANAGEMENT ---
    const getTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

    const worldToTileCoords = (worldX: number, worldY: number) => {
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);
        return { tileX, tileY };
    };

    const createTile = (tileX: number, tileY: number): Tile => {
        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        const tile: Tile = { x: tileX, y: tileY, canvas, context, isDirty: true };
        console.log(`🆕 Created tile at (${tileX}, ${tileY})`);
        return tile;
    };

    const getTile = (tileX: number, tileY: number): Tile => {
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
            }
        }
        ctx.restore();
    }, [canvasState]);

    useEffect(() => {
        renderVisibleTiles();
    }, [canvasState, renderVisibleTiles]);

    // --- MOUSE AND DRAWING HANDLERS ---
    const getMousePosInWorld = (e: MouseEvent | React.MouseEvent): Position => {
        const viewport = viewportCanvasRef.current!;
        const rect = viewport.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - canvasState.offset.x) / canvasState.zoomLevel;
        const worldY = (e.clientY - rect.top - canvasState.offset.y) / canvasState.zoomLevel;
        return { x: worldX, y: worldY };
    };

    const drawOnTile = (tile: Tile, fromX: number, fromY: number, toX: number, toY: number) => {
        const ctx = tile.context;
        ctx.globalCompositeOperation = brushState.mode === 'eraser' ? 'destination-out' : 'source-over';
        if (brushState.mode !== 'eraser') {
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
        setCurrentStrokePath([]);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || brushState.mode === 'move' || canvasState.zoomLevel < 1) return;
        const pos = getMousePosInWorld(e);
        const tileInfo = worldToTileCoords(pos.x, pos.y);
        const tile = getTile(tileInfo.tileX, tileInfo.tileY);
        drawOnTile(
            tile,
            lastPos.x - tile.x * TILE_SIZE,
            lastPos.y - tile.y * TILE_SIZE,
            pos.x - tile.x * TILE_SIZE,
            pos.y - tile.y * TILE_SIZE
        );
        setCurrentStrokePath(prev => [...prev, { fromX: lastPos.x, fromY: lastPos.y, toX: pos.x, toY: pos.y }]);
        setLastPos(pos);
        renderVisibleTiles();
    };

    const stopDrawing = async () => {
        if (!isDrawing || currentStrokePath.length === 0) {
            setIsDrawing(false);
            return;
        }
        setIsDrawing(false);
        const strokeData = { sessionId, canvasId, path: currentStrokePath, brush: brushState, timestamp: new Date().toISOString() };
        setAllStrokes(prev => [...prev, strokeData]);
        setCurrentStrokePath([]);
        try {
            setIsSaving(true);
            setSaveError('');
            console.log('💾 Saving stroke:', strokeData);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('❌ Failed to save stroke:', error);
            setSaveError('Failed to save stroke.');
        } finally {
            setIsSaving(false);
        }
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
        setCanvasState({ zoomLevel: newZoom, offset: { x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom } });
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
            const ctx = tile.context;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.isDirty = true;
        });
        setAllStrokes([]);
        renderVisibleTiles();
    };

    const loadReferenceImage = () => {
        const tile = getTile(0, 0);
        const ctx = tile.context;
        ctx.save();
        // Adjusted scale and offset for 256x256 tile
        const scale = 0.5;
        const offsetX = 60;
        const offsetY = 80;
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
    const startToolboxDrag = (e: React.MouseEvent) => {
        e.stopPropagation(); setIsDraggingToolbox(true);
        setToolboxStart({ x: e.clientX - toolboxPos.x, y: e.clientY - toolboxPos.y });
    };
    const dragToolbox = useCallback((e: MouseEvent) => {
        if (isDraggingToolbox) setToolboxPos({ x: e.clientX - toolboxStart.x, y: e.clientY - toolboxStart.y });
    }, [isDraggingToolbox, toolboxStart]);
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
            if (0 <= h && h < 60) { r = c; g = x; b = 0 } else if (60 <= h && h < 120) { r = x; g = c; b = 0 } else if (120 <= h && h < 180) { r = 0; g = c; b = x }
            else if (180 <= h && h < 240) { r = 0; g = x; b = c } else if (240 <= h && h < 300) { r = x; g = 0; b = c } else { r = c; g = 0; b = x }
            return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
        };
        setBrushState(prev => ({ ...prev, color: hslToRgb(hue, saturation, lightness) }));
    }, [hue, saturation, lightness]);

    const currentColorString = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;

    // --- JSX ---
    return (
        <div style={{ minHeight: '135vh', fontFamily: 'Georgia, serif', overflow: 'auto', position: 'relative' }}>
            <div style={{ marginBottom: "150px", padding: '10px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: '#5d4e37', margin: '0 0 5px 0', fontWeight: 'normal' }}>Demo Canvas</h1>
                <p style={{ color: '#8b795e', fontStyle: 'italic', margin: '0 0 10px 0' }}>
                    Using {TILE_SIZE}px tiles. Zoom with wheel, pan with Move tool.
                </p>
                <button onClick={loadReferenceImage} style={{ backgroundColor: '#8b795e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                    Load Image
                </button>
                <button onClick={handleClearCanvas} style={{ backgroundColor: '#cd5c5c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                    Clear Canvas
                </button>
            </div>

            <div style={{ position: 'absolute', left: toolboxPos.x, top: toolboxPos.y, backgroundColor: 'white', border: '2px solid #8b795e', borderRadius: '8px', padding: '15px', minWidth: '210px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, userSelect: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e0e0e0' }}>
                    <h3 style={{ margin: 0, color: '#5d4e37', fontSize: '16px' }}>Tools</h3>
                    <div onMouseDown={startToolboxDrag} style={{ cursor: 'grab', padding: '5px', color: '#8b795e' }} title="Drag Toolbox">⋮⋮</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button onClick={() => setBrushState(p => ({ ...p, mode: 'brush' }))} style={{ background: brushState.mode === 'brush' ? '#8b795e' : 'transparent', color: brushState.mode === 'brush' ? 'white' : '#8b795e', border: '1px solid #8b795e', borderRadius: '4px', padding: '5px', cursor: 'pointer', flex: 1 }} title="Brush"><Brush size={16} /></button>
                    <button onClick={() => setBrushState(p => ({ ...p, mode: 'eraser' }))} style={{ background: brushState.mode === 'eraser' ? '#8b795e' : 'transparent', color: brushState.mode === 'eraser' ? 'white' : '#8b795e', border: '1px solid #8b795e', borderRadius: '4px', padding: '5px', cursor: 'pointer', flex: 1 }} title="Eraser"><Eraser size={16} /></button>
                    <button onClick={() => setBrushState(p => ({ ...p, mode: 'move' }))} style={{ background: brushState.mode === 'move' ? '#8b795e' : 'transparent', color: brushState.mode === 'move' ? 'white' : '#8b795e', border: '1px solid #8b795e', borderRadius: '4px', padding: '5px', cursor: 'pointer', flex: 1 }} title="Move/Pan"><Move size={16} /></button>
                </div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#5d4e37' }}>Color</label>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 10px', borderRadius: '50%', background: `conic-gradient(hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))`, cursor: 'pointer' }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
                        setHue(((angle * 180 / Math.PI) + 360) % 360);
                    }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '30px', height: '30px', backgroundColor: currentColorString, borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                </div>
                <div style={{ marginBottom: '15px', marginTop: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Brush Size: {brushState.size}px</label>
                    <input type="range" min="1" max="50" value={brushState.size} onChange={e => setBrushState(p => ({ ...p, size: +e.target.value }))} style={{ width: '100%' }} />
                </div>
            </div>

            <div
                ref={containerRef}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}
                // onMouseEnter={() => setIsCanvasHovered(true)}
                // onMouseLeave={() => setIsCanvasHovered(false)}
            >
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

            <div style={{ position: 'absolute', bottom: '40px', right: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '8px', fontSize: '16px', color: '#5d4e37', border: '1px solid #3e2723' }}>
                <div>Zoom: {Math.round(canvasState.zoomLevel * 100)}%</div>
                <div>World Pos: ({mousePos.x}, {mousePos.y})</div>
                <div>Tiles: {totalTiles}</div>
                <div>Strokes: {allStrokes.length}</div>
                {isSaving && <div style={{ color: '#FFA500' }}>Saving...</div>}
                {saveError && <div style={{ color: '#cd5c5c' }}>{saveError}</div>}
            </div>
        </div>
    );
};

export default TiledCanvas; 