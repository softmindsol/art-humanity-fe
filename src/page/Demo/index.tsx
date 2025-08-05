import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Brush, Eraser, Move, RotateCcw } from 'lucide-react';
import api from '@/api/api';
import { getCanvasData } from '@/redux/action/painPixel';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { selectCanvasData } from '@/redux/slice/paintPixel';
import { useSelector } from 'react-redux';

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
    resolution: number;
    zoomLevel: number;
    offset: Position;
}

const DemoCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const initialCanvasState = useRef<ImageData | null>(null);

    // Canvas and brush state
    const [canvasState, setCanvasState] = useState<CanvasState>({
        resolution: 1,
        zoomLevel: 1,
        offset: { x: 0, y: 0 }
    });

    const [brushState, setBrushState] = useState<BrushState>({
        mode: 'brush',
        size: 5,
        color: { r: 0, g: 0, b: 0, a: 1 }
    });

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<Position>({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

    // Toolbox drag states
    const [toolboxPos, setToolboxPos] = useState<Position>({ x: 20, y: 100 });
    const [isDraggingToolbox, setIsDraggingToolbox] = useState(false);
    const [toolboxStart, setToolboxStart] = useState<Position>({ x: 0, y: 0 });
    const strokes = useSelector(selectCanvasData);
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);

    // Color picker states
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [canvasId, setCanvasId] = useState<string>(''); // or pass as prop

    // All strokes for this session
    const [allStrokes, setAllStrokes] = useState<any[]>([]);
    const [sessionId, setSessionId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string>('');
    const dispatch = useDispatch<AppDispatch>();

    // Generate session ID on mount
    useEffect(() => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        console.log('🆔 New session created:', newSessionId);
    }, []);

    useEffect(() => {
        const id = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        setCanvasId(id);
    }, []);

    const boardSize = 768; // or 512, 900 etc.
    const boardX = (1024 - boardSize) / 2;
    const boardY = (1024 - boardSize) / 2;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasSize = Math.floor(1024 * canvasState.resolution);
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill entire canvas with gray
        ctx.fillStyle = '#dcdcdc'; // light gray
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw central white board
        const scaledBoardSize = boardSize * canvasState.resolution;
        const scaledBoardX = boardX * canvasState.resolution;
        const scaledBoardY = boardY * canvasState.resolution;

        ctx.fillStyle = '#ffffff'; // white board
        ctx.fillRect(scaledBoardX, scaledBoardY, scaledBoardSize, scaledBoardSize);

        initialCanvasState.current = ctx.getImageData(0, 0, canvasSize, canvasSize);

        console.log('Canvas initialized:', canvasSize + 'x' + canvasSize);
    }, [canvasState.resolution]);


    // Redraw canvas when strokes change
    useEffect(() => {
        redrawCanvas();
    }, [allStrokes]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas first
        if (initialCanvasState.current) {
            ctx.putImageData(initialCanvasState.current, 0, 0);
        }

        // Redraw all strokes
        allStrokes.forEach((stroke: any) => {
            if (stroke.strokePath && stroke.strokePath.length > 0) {
                if (stroke.mode === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = `rgba(${stroke.color.r}, ${stroke.color.g}, ${stroke.color.b}, ${stroke.color.a})`;
                }

                ctx.lineWidth = stroke.brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                stroke.strokePath.forEach((point: any) => {
                    ctx.beginPath();
                    ctx.moveTo(point.fromX, point.fromY);
                    ctx.lineTo(point.toX, point.toY);
                    ctx.stroke();
                });
            }
        });
    };

    const getMousePos = (e: MouseEvent | React.MouseEvent): Position => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        const canvasX = (e.clientX - rect.left) / canvasState.zoomLevel;
        const canvasY = (e.clientY - rect.top) / canvasState.zoomLevel;

        return { x: canvasX, y: canvasY };
    };

    const [currentStrokePath, setCurrentStrokePath] = useState<StrokeData[]>([]);

    const startDrawing = (e: React.MouseEvent) => {
        if (brushState.mode === 'move') return;

        setIsDrawing(true);
        const pos = getMousePos(e);
        setLastPos(pos);
        setCurrentStrokePath([]);

        console.log('🎨 Starting Paint Stroke at:', pos);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || brushState.mode === 'move') return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getMousePos(e);

        // Draw locally for immediate feedback
        if (brushState.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;
        }

        ctx.lineWidth = brushState.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        // Add to current stroke path
        const strokePoint: StrokeData = {
            fromX: lastPos.x,
            fromY: lastPos.y,
            toX: pos.x,
            toY: pos.y
        };

        setCurrentStrokePath(prev => [...prev, strokePoint]);
        setLastPos(pos);
    };

    const stopDrawing = async () => {
        if (!isDrawing || currentStrokePath.length === 0) {
            setIsDrawing(false);
            return;
        }

        // Prepare stroke data
        const strokeData = {
            sessionId: sessionId,
            canvasId: canvasId, // ✅ add this line
            strokePath: currentStrokePath,
            brushSize: brushState.size,
            color: brushState.color,
            mode: brushState.mode,
            canvasResolution: canvasState.resolution,
            canvasSize: Math.floor(1024 * canvasState.resolution),
            zoomLevel: canvasState.zoomLevel,
            canvasOffset: canvasState.offset,
            timestamp: new Date().toISOString()
        };

        // Add to local state immediately (optimistic update)
        setAllStrokes(prev => [...prev, strokeData]);

        // Add color to recent colors if brush mode
        if (brushState.mode === 'brush') {
            const newColor = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;
            setRecentColors((prev) => {
                if (!prev.includes(newColor)) {
                    return [newColor, ...prev.slice(0, 4)];
                }
                return prev;
            });
        }

        setIsDrawing(false);
        setCurrentStrokePath([]);

        // Save to database in background
        try {
            setIsSaving(true);
            setSaveError('');
            const response = await api.post(`/stroke`, strokeData);
            console.log("hello")
            return response.data; // backend returns { success: true, data: {...} }

        } catch (error) {
            console.error('❌ Failed to save stroke to database:', error);
            setSaveError('Failed to save to database');

            // Optionally: Remove the stroke from local state if save failed
            // setAllStrokes(prev => prev.slice(0, -1));

            // Or show a retry option
            // You could add a retry mechanism here

        } finally {
            setIsSaving(false);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        const container = e.currentTarget as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        const newZoom = Math.min(Math.max(canvasState.zoomLevel * zoomFactor, 0.1), 8);

        const canvasPointX = (mouseX - containerCenterX - canvasState.offset.x) / canvasState.zoomLevel;
        const canvasPointY = (mouseY - containerCenterY - canvasState.offset.y) / canvasState.zoomLevel;

        const newOffset = {
            x: mouseX - containerCenterX - canvasPointX * newZoom,
            y: mouseY - containerCenterY - canvasPointY * newZoom
        };

        setCanvasState(prev => ({
            ...prev,
            zoomLevel: newZoom,
            offset: newOffset
        }));
    };

    useEffect(() => {
        if (strokes?.length > 0) {
            redrawCanvas();
        }
    }, [strokes]);

    useEffect(() => {
        const sessionId = localStorage.getItem('paint-session-id');
        const resolution = 1;

        if (sessionId) {
            dispatch(getCanvasData({ sessionId, canvasResolution: resolution }));
        }
    }, [dispatch]);


    const startPan = (e: React.MouseEvent) => {
        if (brushState.mode !== 'move') return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasState.offset.x, y: e.clientY - canvasState.offset.y });
    };

    const pan = (e: React.MouseEvent) => {
        if (!isPanning) return;
        const newOffset = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
        setCanvasState(prev => ({ ...prev, offset: newOffset }));
    };

    const stopPan = () => {
        setIsPanning(false);
    };

    const handleClearCanvas = async () => {
        // Clear locally first for immediate feedback
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        if (initialCanvasState.current) {
            ctx.putImageData(initialCanvasState.current, 0, 0);
        }

        setAllStrokes([]);

        // Clear from database
        if (sessionId) {
            try {
                const response = await fetch(`/api/v1/strokes/${sessionId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                console.log('✅ Canvas cleared from database');
            } catch (error) {
                console.error('❌ Failed to clear canvas from database:', error);
                setSaveError('Failed to clear database');
            }
        }

        console.log('🧹 Canvas cleared locally');
    };

    const loadReferenceImage = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const scale = canvasState.resolution;

        ctx.save();

        // House body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(400 * scale, 500 * scale, 224 * scale, 200 * scale);

        // Roof
        ctx.fillStyle = '#CD5C5C';
        ctx.beginPath();
        ctx.moveTo(380 * scale, 500 * scale);
        ctx.lineTo(512 * scale, 400 * scale);
        ctx.lineTo(644 * scale, 500 * scale);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(480 * scale, 600 * scale, 64 * scale, 100 * scale);

        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(420 * scale, 550 * scale, 40 * scale, 40 * scale);
        ctx.fillRect(564 * scale, 550 * scale, 40 * scale, 40 * scale);

        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(530 * scale, 650 * scale, 3 * scale, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    };

    // Toolbox drag handlers
    const startToolboxDrag = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingToolbox(true);
        setToolboxStart({ x: e.clientX - toolboxPos.x, y: e.clientY - toolboxPos.y });
    };

    const dragToolbox = useCallback((e: MouseEvent) => {
        if (!isDraggingToolbox) return;
        setToolboxPos({ x: e.clientX - toolboxStart.x, y: e.clientY - toolboxStart.y });
    }, [isDraggingToolbox, toolboxStart]);

    const stopToolboxDrag = useCallback(() => {
        setIsDraggingToolbox(false);
    }, []);

    useEffect(() => {
        if (isCanvasHovered) {
            document.body.style.overflow = 'hidden'; // Disable scroll
        } else {
            document.body.style.overflow = ''; // Restore scroll
        }

        return () => {
            document.body.style.overflow = ''; // Cleanup on unmount
        };
    }, [isCanvasHovered]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            const { width, height } = parent.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            // Optional: Store initial state again
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, width, height);
            initialCanvasState.current = ctx.getImageData(0, 0, width, height);

            redrawCanvas(); // Redraw after resize
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        if (isDraggingToolbox) {
            document.addEventListener('mousemove', dragToolbox);
            document.addEventListener('mouseup', stopToolboxDrag);
            return () => {
                document.removeEventListener('mousemove', dragToolbox);
                document.removeEventListener('mouseup', stopToolboxDrag);
            };
        }
    }, [isDraggingToolbox, dragToolbox, stopToolboxDrag]);

    // HSL to RGB conversion
    const hslToRgb = (h: number, s: number, l: number): RgbaColor => {
        h /= 360;
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 1 / 6) {
            r = c; g = x; b = 0;
        } else if (1 / 6 <= h && h < 2 / 6) {
            r = x; g = c; b = 0;
        } else if (2 / 6 <= h && h < 3 / 6) {
            r = 0; g = c; b = x;
        } else if (3 / 6 <= h && h < 4 / 6) {
            r = 0; g = x; b = c;
        } else if (4 / 6 <= h && h < 5 / 6) {
            r = x; g = 0; b = c;
        } else if (5 / 6 <= h && h < 1) {
            r = c; g = 0; b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
            a: 1
        };
    };

    // Update brush color when HSL changes
    useEffect(() => {
        const newColor = hslToRgb(hue, saturation, lightness);
        setBrushState(prev => ({ ...prev, color: newColor }));
    }, [hue, saturation, lightness]);

    const selectRecentColor = (colorString: string) => {
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            const newColor = {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: parseFloat(match[4])
            };
            setBrushState(prev => ({ ...prev, color: newColor }));
        }
    };

    const currentColorString = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;

    return (
        <div style={{
            
            height: '100vh',
           
            fontFamily: 'Georgia, serif',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                textAlign: 'center',
                // backgroundColor: 'rgba(139, 121, 94, 0.1)'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    color: '#5d4e37',
                    margin: '0 0 10px 0',
                    fontWeight: 'normal'
                }}>Demo Canvas</h1>
                <p style={{
                    color: '#8b795e',
                    fontStyle: 'italic',
                    margin: '0 0 20px 0'
                }}>
                    Canvas: {Math.floor(1024 * canvasState.resolution)}px × {Math.floor(1024 * canvasState.resolution)}px at {canvasState.resolution}x resolution
                </p>

                <button
                    onClick={loadReferenceImage}
                    style={{
                        backgroundColor: '#8b795e',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginRight: '10px'
                    }}
                >
                    Load Reference Images
                </button>

                <button
                    onClick={handleClearCanvas}
                    style={{
                        backgroundColor: '#cd5c5c',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginRight: '10px'
                    }}
                >
                    Clear Canvas
                </button>

                {/* Resolution Controls */}
                <div style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '220px' // optional: control width
                }}>
                    <select
                        value={canvasState.resolution}
                        onChange={(e) => {
                            const newRes = Number(e.target.value);
                            setCanvasState(prev => ({ ...prev, resolution: newRes }));
                            console.log('Resolution changed to:', newRes);
                        }}
                        style={{
                            appearance: 'none', // hide default arrow
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundColor: '#8b795e',
                            color: 'white',
                            border: 'none',
                            padding: '10px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            width: '100%',
                        }}
                    >
                        <option value={0.25}>256px (0.25x)</option>
                        <option value={0.5}>512px (0.5x)</option>
                        <option value={1}>1024px (1x)</option>
                        <option value={2}>2048px (2x)</option>
                        <option value={4}>4096px (4x)</option>
                    </select>

                    {/* Arrow icon */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '12px',
                        pointerEvents: 'none',
                        transform: 'translateY(-50%)',
                        color: 'white',
                        fontSize: '14px'
                    }}>
                        ▼
                    </div>
                </div>


                <p style={{
                    color: '#8b795e',
                    fontSize: '14px',
                    margin: '20px 0 0 0'
                }}>
                    Use mouse wheel to zoom, right-click to pan, and left click to draw.
                    Drag toolbox to move. Now saves to database with local feedback!
                </p>
            </div>

            {/* Drawing Toolbox */}
            <div
                style={{
                    position: 'absolute',
                    left: toolboxPos.x,
                    top: toolboxPos.y,
                    backgroundColor: 'white',
                    border: '2px solid #8b795e',
                    borderRadius: '8px',
                    padding: '15px',
                    minWidth: '200px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    userSelect: 'none'
                }}
            >
                {/* Toolbox Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <h3 className='mt-3' style={{
                        marginRight: 10,
                        color: '#5d4e37',
                        fontSize: '16px'
                    }}>Drawing Tools</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setBrushState(prev => ({ ...prev, mode: 'brush' }))}
                            style={{
                                background: brushState.mode === 'brush' ? '#8b795e' : 'transparent',
                                color: brushState.mode === 'brush' ? 'white' : '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px',
                                padding: '5px',
                                cursor: 'pointer'
                            }}
                            title="Brush"
                        >
                            <Brush size={16} />
                        </button>
                        <button
                            onClick={() => setBrushState(prev => ({ ...prev, mode: 'eraser' }))}
                            style={{
                                background: brushState.mode === 'eraser' ? '#8b795e' : 'transparent',
                                color: brushState.mode === 'eraser' ? 'white' : '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px',
                                padding: '5px',
                                cursor: 'pointer'
                            }}
                            title="Eraser"
                        >
                            <Eraser size={16} />
                        </button>
                        {/* <button
                            onClick={() => setBrushState(prev => ({ ...prev, mode: 'move' }))}
                            style={{
                                background: brushState.mode === 'move' ? '#8b795e' : 'transparent',
                                color: brushState.mode === 'move' ? 'white' : '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px',
                                padding: '5px',
                                cursor: 'pointer'
                            }}
                            title="Move/Pan"
                        >
                            <Move size={16} />
                        </button> */}
                        <div
                            onMouseDown={startToolboxDrag}
                            style={{
                                cursor: 'grab',
                                padding: '5px',
                                color: '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px'
                            }}
                            title="Drag Toolbox"
                        >
                            <Move size={16} />
                        </div>
                    </div>
                </div>

                {/* Color Section */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#5d4e37'
                    }}>Color</div>

                    {/* Color Wheel */}
                    <div style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 10px',
                        borderRadius: '50%',
                        background: `conic-gradient(
                            hsl(0, 100%, 50%),
                            hsl(60, 100%, 50%),
                            hsl(120, 100%, 50%),
                            hsl(180, 100%, 50%),
                            hsl(240, 100%, 50%),
                            hsl(300, 100%, 50%),
                            hsl(360, 100%, 50%)
                        )`,
                        cursor: 'pointer'
                    }}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                            const hueValue = ((angle * 180 / Math.PI) + 360) % 360;
                            setHue(hueValue);
                            const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
                            const radius = rect.width / 2;
                            const satValue = Math.min(100, (distance / radius) * 100);
                            setSaturation(satValue);
                        }}>
                        {/* Center circle showing current color */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '30px',
                            height: '30px',
                            backgroundColor: currentColorString,
                            borderRadius: '50%',
                            border: '3px solid white',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                        }} />

                        {/* Color selector dot */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            border: '2px solid black',
                            transform: `translate(-50%, -50%) rotate(${hue}deg) translateX(${saturation * 0.45}px)`,
                            transformOrigin: 'center',
                            pointerEvents: 'none'
                        }} />
                    </div>

                    {/* Lightness slider */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                            Lightness: {lightness}%
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="90"
                            value={lightness}
                            onChange={(e) => setLightness(Number(e.target.value))}
                            style={{
                                width: '100%',
                                background: `linear-gradient(to right, 
                                    hsl(${hue}, ${saturation}%, 10%), 
                                    hsl(${hue}, ${saturation}%, 50%), 
                                    hsl(${hue}, ${saturation}%, 90%))`
                            }}
                        />
                    </div>

                    {/* Common colors palette */}
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Quick Colors</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px' }}>
                            {[
                                '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                                '#800000', '#808080', '#800080', '#008000', '#000080', '#808000', '#C0C0C0', '#008080',
                                '#FF8000', '#FF0080', '#80FF00', '#8000FF', '#0080FF', '#FF8080', '#80FF80', '#8080FF'
                            ].map((hexColor, index) => {
                                const r = parseInt(hexColor.slice(1, 3), 16);
                                const g = parseInt(hexColor.slice(3, 5), 16);
                                const b = parseInt(hexColor.slice(5, 7), 16);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setBrushState(prev => ({ ...prev, color: { r, g, b, a: 1 } }));
                                        }}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: hexColor,
                                            border: '1px solid #ddd',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Brush Size Section */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#5d4e37'
                    }}>Brush Size</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={brushState.size}
                            onChange={(e) => {
                                setBrushState(prev => ({ ...prev, size: Number(e.target.value) }));
                            }}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '12px', minWidth: '20px' }}>{brushState.size}</span>
                        <div
                            style={{
                                width: Math.min(brushState.size * 2, 30),
                                height: Math.min(brushState.size * 2, 30),
                                backgroundColor: currentColorString,
                                borderRadius: '50%',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>
                </div>

                {/* Recent Colors Section */}
                <div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#5d4e37'
                    }}>Recent Colors</div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {recentColors.map((recentColor, index) => (
                            <div
                                key={index}
                                onClick={() => selectRecentColor(recentColor)}
                                style={{
                                    width: '25px',
                                    height: '25px',
                                    backgroundColor: recentColor,
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Canvas Container */}
            <div
                style={{
                    position: 'absolute',
                    top: '200px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'auto',
                    height: 'calc(100vh - 240px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                }}
                onContextMenu={(e) => e.preventDefault()}
                onMouseEnter={() => setIsCanvasHovered(true)}
                onMouseLeave={() => setIsCanvasHovered(false)}
               
            >
                <div
                    style={{
                        // position: 'relative',
                        border: '4px solid #4d2d2d',
                        overflow: 'hidden',
                        width: '600px',
                        height: '600px',
                        backgroundColor: '#ccc',
                        cursor: isPanning || brushState.mode === 'move'
                            ? (isPanning ? 'grabbing' : 'grab')
                            : brushState.mode === 'eraser'
                                ? 'crosshair'
                                : 'crosshair'
                    }}
                    onWheel={handleWheel}
                    onMouseDown={(e) => {
                        if (e.button === 2 || brushState.mode === 'move') startPan(e);
                        else startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                        const container = e.currentTarget;
                        const canvas = canvasRef.current!;
                        const containerRect = container.getBoundingClientRect();
                        const canvasRect = canvas.getBoundingClientRect();

                        const canvasX = (e?.clientX - canvasRect?.left) / canvasState.zoomLevel;
                        const canvasY = (e?.clientY - canvasRect?.top) / canvasState.zoomLevel;

                        const canvasSize = Math.floor(1024 * canvasState.resolution);
                        const clampedX = Math.max(0, Math.min(canvasSize, canvasX));
                        const clampedY = Math.max(0, Math.min(canvasSize, canvasY));

                        setMousePos({ x: Math.round(clampedX), y: Math.round(clampedY) });

                        if (isPanning) {
                            pan(e);
                        } else if (isDrawing) {
                            draw(e);
                        }
                    }}
                    onMouseUp={() => {
                        stopDrawing();
                        stopPan();
                    }}
                    onMouseLeave={() => {
                        stopDrawing();
                        stopPan();
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) translate(${canvasState.offset.x}px, ${canvasState.offset.y}px) scale(${canvasState.zoomLevel})`,
                            transformOrigin: 'center center',
                            backgroundColor: '#ccc',
                            // cursor: isPanning || brushState.mode === 'move'
                            //     ? (isPanning ? 'grabbing' : 'grab')
                            //     : brushState.mode === 'eraser'
                            //         ? 'crosshair'
                            //         : 'crosshair',
                            imageRendering: canvasState.zoomLevel > 2 ? 'pixelated' : 'auto',
                            transition: 'none',
                             cursor: brushState.mode === 'move' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair',
                            // imageRendering: canvasState.zoomLevel > 2 ? 'pixelated' : 'auto',
                        }}
                    />
                </div>

                {/* Canvas Info */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#5d4e37',
                    border: '2px solid #3e2723'
                }}>
                    <div>Canvas: {Math.floor(1024 * canvasState.resolution)}×{Math.floor(1024 * canvasState.resolution)}px</div>
                    <div>Zoom: {Math.round(canvasState.zoomLevel * 100)}%</div>
                    <div>Position: ({mousePos.x}, {mousePos.y})</div>
                    <div>Mode: {brushState.mode}</div>
                    <div>Strokes: {allStrokes.length}</div>
                    {isDrawing && <div style={{ color: '#cd5c5c' }}>✏️ Drawing...</div>}
                    {isSaving && <div style={{ color: '#FFA500' }}>💾 Saving...</div>}
                    {saveError && <div style={{ color: '#cd5c5c' }}>❌ Save Error</div>}
                </div>
            </div>
        </div>
    );
};

export default DemoCanvas;