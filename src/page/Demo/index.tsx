import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Brush, Eraser, Move, RotateCcw } from 'lucide-react';

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

const DemoCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const initialCanvasState = useRef<ImageData | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(3);
    const [color, setColor] = useState<RgbaColor>({ r: 0, g: 0, b: 0, a: 1 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
    const [lastPos, setLastPos] = useState<Position>({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

    const [mode, setMode] = useState<'brush' | 'eraser' | 'move'>('brush');

    // Toolbox drag states
    const [toolboxPos, setToolboxPos] = useState<Position>({ x: 20, y: 100 });
    const [isDraggingToolbox, setIsDraggingToolbox] = useState(false);
    const [toolboxStart, setToolboxStart] = useState<Position>({ x: 0, y: 0 });

    // Color picker states
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 1024;
                canvas.height = 1024;
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Save initial state
                initialCanvasState.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    const getMousePos = (e: MouseEvent | React.MouseEvent): Position => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        // Calculate the actual canvas coordinates considering zoom and offset
        const canvasX = (e.clientX - rect.left) / zoom;
        const canvasY = (e.clientY - rect.top) / zoom;

        return {
            x: canvasX,
            y: canvasY,
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (mode === 'move') return;
        setIsDrawing(true);
        setLastPos(getMousePos(e));
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || mode === 'move') return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getMousePos(e);

        if (mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        setLastPos(pos);
    };

    const stopDrawing = () => {
        if (isDrawing && mode === 'brush') {
            const newColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
            setRecentColors((prev) => {
                if (!prev.includes(newColor)) {
                    return [newColor, ...prev.slice(0, 4)];
                }
                return prev;
            });
        }
        setIsDrawing(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        // Get container and canvas elements
        const container = e.currentTarget as HTMLElement;
        const canvas = canvasRef.current!;
        const containerRect = container.getBoundingClientRect();

        // Mouse position relative to container
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Container center
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        // Calculate zoom factor (smaller increments for smoother zoom)
        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 8);

        // Calculate the point on the canvas that the mouse is over
        const canvasPointX = (mouseX - containerCenterX - offset.x) / zoom;
        const canvasPointY = (mouseY - containerCenterY - offset.y) / zoom;

        // Calculate new offset to keep the same canvas point under the mouse
        const newOffset = {
            x: mouseX - containerCenterX - canvasPointX * newZoom,
            y: mouseY - containerCenterY - canvasPointY * newZoom
        };

        setZoom(newZoom);
        setOffset(newOffset);
    };

    const startPan = (e: React.MouseEvent) => {
        if (mode !== 'move') return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const pan = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };

    const stopPan = () => {
        setIsPanning(false);
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

    // Add global mouse events for toolbox dragging
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

    // Update color when HSL changes
    useEffect(() => {
        const newColor = hslToRgb(hue, saturation, lightness);
        setColor(newColor);
    }, [hue, saturation, lightness]);

    const loadReferenceImage = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        // Create a simple house drawing as reference
        ctx.save();

        // House body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(400, 500, 224, 200);

        // Roof
        ctx.fillStyle = '#CD5C5C';
        ctx.beginPath();
        ctx.moveTo(380, 500);
        ctx.lineTo(512, 400);
        ctx.lineTo(644, 500);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(480, 600, 64, 100);

        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(420, 550, 40, 40);
        ctx.fillRect(564, 550, 40, 40);

        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(530, 650, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        if (initialCanvasState.current) {
            ctx.putImageData(initialCanvasState.current, 0, 0);
        }
    };

    const selectRecentColor = (colorString: string) => {
        // Parse the rgba string to extract values
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            setColor({
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: parseFloat(match[4])
            });
        }
    };

    const currentColorString = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#d4c4a8',
            fontFamily: 'Georgia, serif',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(139, 121, 94, 0.1)'
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
                    This canvas is 1024px by 1024px, don't believe us? Load the reference images!
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
                    onClick={clearCanvas}
                    style={{
                        backgroundColor: '#cd5c5c',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Clear Canvas
                </button>

                <p style={{
                    color: '#8b795e',
                    fontSize: '14px',
                    margin: '20px 0 0 0'
                }}>
                    Use the mouse wheel to zoom, right-click to pan, and left click to draw when zoomed in.
                    Adjust brush and colors from the toolbox. Drag toolbox to move.
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
                    <h3 style={{
                        margin: 0,
                        color: '#5d4e37',
                        fontSize: '16px'
                    }}>Drawing Tools</h3>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <button
                            onClick={() => setMode('brush')}
                            style={{
                                background: mode === 'brush' ? '#8b795e' : 'transparent',
                                color: mode === 'brush' ? 'white' : '#8b795e',
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
                            onClick={() => setMode('eraser')}
                            style={{
                                background: mode === 'eraser' ? '#8b795e' : 'transparent',
                                color: mode === 'eraser' ? 'white' : '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px',
                                padding: '5px',
                                cursor: 'pointer'
                            }}
                            title="Eraser"
                        >
                            <Eraser size={16} />
                        </button>
                        <button
                            onClick={() => setMode('move')}
                            style={{
                                background: mode === 'move' ? '#8b795e' : 'transparent',
                                color: mode === 'move' ? 'white' : '#8b795e',
                                border: '1px solid #8b795e',
                                borderRadius: '4px',
                                padding: '5px',
                                cursor: 'pointer'
                            }}
                            title="Move/Pan"
                        >
                            <Move size={16} />
                        </button>
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
                                        onClick={() => setColor({ r, g, b, a: 1 })}
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
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '12px', minWidth: '20px' }}>{brushSize}</span>
                        <div
                            style={{
                                width: Math.min(brushSize * 2, 30),
                                height: Math.min(brushSize * 2, 30),
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
            >
                <div
                    style={{
                        position: 'relative',
                        border: '2px solid #4d2d2d',
                        overflow: 'hidden',
                        width: '600px',
                        height: '600px',
                        backgroundColor: '#f0f0f0',
                        cursor: isPanning || mode === 'move'
                            ? (isPanning ? 'grabbing' : 'grab')
                            : mode === 'eraser'
                                ? 'crosshair'
                                : 'crosshair'
                    }}
                    onWheel={handleWheel}
                    onMouseDown={(e) => {
                        if (e.button === 2 || mode === 'move') startPan(e);
                        else startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                        // Always update mouse position for cursor tracking
                        const container = e.currentTarget;
                        const canvas = canvasRef.current!;
                        const containerRect = container.getBoundingClientRect();
                        const canvasRect = canvas.getBoundingClientRect();

                        // Calculate mouse position on the actual canvas
                        const canvasX = (e.clientX - canvasRect.left) / zoom;
                        const canvasY = (e.clientY - canvasRect.top) / zoom;

                        // Clamp to canvas bounds for display
                        const clampedX = Math.max(0, Math.min(1024, canvasX));
                        const clampedY = Math.max(0, Math.min(1024, canvasY));

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
                        // Stop drawing/panning when mouse leaves the container
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
                            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            backgroundColor: '#f0f0f0',
                            cursor: isPanning || mode === 'move'
                                ? (isPanning ? 'grabbing' : 'grab')
                                : mode === 'eraser'
                                    ? 'crosshair'
                                    : 'crosshair',
                            imageRendering: zoom > 2 ? 'pixelated' : 'auto',
                            transition: 'none'
                        }}
                    />
                </div>

                {/* Canvas Info */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#5d4e37',
                    border: '1px solid #ddd'
                }}>
                    <div>Zoom: {Math.round(zoom * 100)}%</div>
                    <div>Position: ({mousePos.x}, {mousePos.y})</div>
                    <div>Mode: {mode}</div>
                </div>
            </div>
        </div>
    );
};

export default DemoCanvas;