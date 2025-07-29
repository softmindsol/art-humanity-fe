import React, { useRef, useState, useEffect } from 'react';
import { RgbaColorPicker } from 'react-colorful';
import '../../style/demo.css';
import { Brush, Eraser, Move } from 'lucide-react';
import house from '../../assets/images/house.png'
interface Position {
    x: number;
    y: number;
}

const DemoCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(3);
    const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
    const [lastPos, setLastPos] = useState<Position>({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

    const [mode, setMode] = useState<'brush' | 'eraser' | 'move'>('brush');

    // Toolbox drag states
    const [toolboxPos, setToolboxPos] = useState<Position>({ x: 20, y: 500 });
    const [isDraggingToolbox, setIsDraggingToolbox] = useState(false);
    const [toolboxStart, setToolboxStart] = useState<Position>({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 1024;
                canvas.height = 1024;
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    const getMousePos = (e: MouseEvent | React.MouseEvent): Position => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - offset.x) / zoom,
            y: (e.clientY - rect.top - offset.y) / zoom,
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
        let newZoom = zoom + (e.deltaY < 0 ? 0.1 : -0.1);
        newZoom = Math.min(Math.max(newZoom, 0.5), 5);
        setZoom(newZoom);
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

    const dragToolbox = (e: React.MouseEvent) => {
        if (!isDraggingToolbox) return;
        setToolboxPos({ x: e.clientX - toolboxStart.x, y: e.clientY - toolboxStart.y });
    };

    const stopToolboxDrag = () => {
        setIsDraggingToolbox(false);
    };

    // 🔥 Load reference image function with smaller size and centered
    const loadReferenceImage = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.src = `${house}`; // 👈 Put your image in "public" folder with this name
        img.onload = () => {
            const imgWidth = 200; // 👈 Desired image width
            const imgHeight = 200; // 👈 Desired image height

            const x = (canvas.width - imgWidth) / 2; // center X
            const y = (canvas.height - imgHeight) / 2; // center Y

            ctx.drawImage(img, x, y, imgWidth, imgHeight);
        };
    };



    return (
        <div className="container">
            <main>
                <section className="contribute-header">
                    <h2>Demo Canvas</h2>
                    <p>This canvas is 1024px by 1024px, don't believe us? Load the reference images!</p>
                </section>

                {/* Reference Images Button */}
                <div className="reference-images-container">
                    <button id="load-reference-images" className="reference-btn">Load Reference Images</button>
                </div>

                <section className="contribute-instructions">
                    <p>
                        Use the mouse wheel to zoom, right-click to pan, and left click to draw when zoomed in.
                        Adjust brush and colors from the toolbox. Drag toolbox to move.
                    </p>
                </section>

                {/* Drawing Toolbox */}
                <div className="drawing-toolbox" id="drawing-toolbox">
                    <div className="toolbox-header">
                        <h3>Drawing Tools</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setMode('brush')} title="Brush"><Brush size={18} /></button>
                            <button onClick={() => setMode('eraser')} title="Eraser"><Eraser size={18} /></button>
                            <div
                                onMouseDown={startToolboxDrag}
                                style={{ cursor: 'grab' }}
                                title="Move Toolbox"
                            >
                                <Move size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Color</div>
                        <div className="color-disc-container">
                            <div className="color-disc" id="color-disc"></div>
                            <div className="color-disc-selector" id="color-selector"></div>
                            <div className="color-disc-brightness" id="color-brightness">
                                <div className="brightness-selector"></div>
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Brush Size</div>
                        <div className="brush-controls">
                            <div className="brush-size-controls">
                                <div className="brush-size-slider-container">
                                    <input type="range" min="1" max="20" defaultValue="3" id="brush-size-slider" />
                                    <span id="brush-size-value" className="brush-size-value">3</span>
                                </div>
                            </div>
                            <div className="brush-preview">
                                <div className="brush-circle" id="brush-size-preview"></div>
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Recent Colors</div>
                        <div className="recent-colors">
                            {/* Dynamic recent colors will go here */}
                        </div>
                    </div>
                </div>

                <section
                    className="canvas-container"
                    onWheel={handleWheel}
                    onMouseDown={(e) => {
                        if (e.button === 2 || mode === 'move') startPan(e);
                        else startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                        const pos = getMousePos(e);
                        setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });

                        if (isPanning) pan(e);
                        else draw(e);
                    }}
                    onMouseUp={() => {
                        stopDrawing();
                        stopPan();
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            border: '2px solid #4d2d2d',
                            backgroundColor: '#f0f0f0',
                            cursor: isPanning ? 'grab' : mode === 'move' ? 'grab' : 'crosshair',
                        }}
                    ></canvas>

                    <div className="canvas-info-container">
                        <div className="canvas-info-header">
                            <h3>Canvas Info</h3>
                            <div className="canvas-info-drag-handle">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="4" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="4" cy="12" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="12" r="1.5" fill="#8d6e63" />
                                </svg>
                            </div>
                        </div>
                        <div className="canvas-info">
                            <span id="zoom-level">Zoom: 100%</span>
                            <span id="coordinates">Position: (0, 0)</span>
                        </div>
                    </div>

                  
                </section>
            </main>
        </div>
    );
};

export default DemoCanvas;