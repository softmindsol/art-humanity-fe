import React, { useRef, useState, useEffect } from 'react';
import * as fabric  from 'fabric';
import { RgbaColorPicker } from 'react-colorful';
import '../../style/demo.css';
import { Brush, Eraser, Move } from 'lucide-react';
import house from '../../assets/images/house.png';

interface Position {
    x: number;
    y: number;
}

const DemoCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const [brushSize, setBrushSize] = useState(3);
    const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
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
        // Initialize Fabric.js canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1024,
            height: 1024,
            backgroundColor: '#f0f0f0',
        });
        fabricCanvasRef.current = canvas;

        // Initialize brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        canvas.isDrawingMode = mode === 'brush' || mode === 'eraser';

        // Handle mouse wheel for zooming
        const handleWheel = (opt: fabric.IEvent) => {
            const e = opt.e as WheelEvent;
            e.preventDefault();
            let newZoom = zoom + (e.deltaY < 0 ? 0.1 : -0.1);
            newZoom = Math.min(Math.max(newZoom, 0.5), 5);
            setZoom(newZoom);
            canvas.setZoom(newZoom);
            canvas.renderAll();
        };

        // Update mouse position
        const handleMouseMove = (opt: fabric.IEvent) => {
            const pos = canvas.getPointer(opt.e);
            setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
        };

        // Log path creation to confirm drawing
        const handlePathCreated = (opt: fabric.IEvent) => {
            console.log('Path created:', opt);
            if (mode === 'brush') {
                const newColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
                setRecentColors((prev) => {
                    if (!prev.includes(newColor)) {
                        return [newColor, ...prev.slice(0, 4)];
                    }
                    return prev;
                });
            }
        };

        canvas.on('mouse:wheel', handleWheel);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('path:created', handlePathCreated);

        // Cleanup on unmount
        return () => {
            canvas.off('mouse:wheel', handleWheel);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('path:created', handlePathCreated);
            canvas.dispose();
        };
    }, [mode, color]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Update brush settings
        if (mode === 'eraser') {
            canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
        } else if (mode === 'brush') {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = brushSize;
            canvas.freeDrawingBrush.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        }
        canvas.isDrawingMode = mode === 'brush' || mode === 'eraser';
        canvas.renderAll();
    }, [mode, brushSize, color]);

    const startPan = (opt: fabric.IEvent) => {
        if (mode !== 'move') return;
        setIsPanning(true);
        const e = opt.e as MouseEvent;
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const pan = (opt: fabric.IEvent) => {
        if (!isPanning) return;
        const e = opt.e as MouseEvent;
        const newOffset = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
        setOffset(newOffset);
        fabricCanvasRef.current!.setViewportTransform([
            zoom,
            0,
            0,
            zoom,
            newOffset.x,
            newOffset.y,
        ]);
        fabricCanvasRef.current!.renderAll();
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

    // Load reference image
    const loadReferenceImage = () => {
        const canvas = fabricCanvasRef.current!;
        fabric.Image.fromURL(house, (img) => {
            const imgWidth = 200;
            const imgHeight = 200;
            img.set({
                left: (canvas.width! - imgWidth) / 2,
                top: (canvas.height! - imgHeight) / 2,
                scaleX: imgWidth / img.width!,
                scaleY: imgHeight / img.height!,
            });
            canvas.add(img);
            canvas.renderAll();
        });
    };

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (opt: fabric.IEvent) => {
            if ((opt.e as MouseEvent).button === 2 || mode === 'move') {
                startPan(opt);
            }
        };

        const handleMouseMove = (opt: fabric.IEvent) => {
            if (isPanning) pan(opt);
        };

        const handleMouseUp = () => {
            stopPan();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [mode, isPanning]);

    return (
        <div className="container">
            <main>
                <section className="contribute-header">
                    <h2>Demo Canvas</h2>
                    <p>This canvas is 1024px by 1024px, don't believe us? Load the reference images!</p>
                </section>

                <div className="reference-images-container">
                    <button className="reference-btn" onClick={loadReferenceImage}>
                        Load Reference Images
                    </button>
                </div>

                <section className="contribute-instructions">
                    <p>
                        Use the mouse wheel to zoom, right-click to pan, and left-click to draw when zoomed in.
                        Adjust brush and colors from the toolbox. Drag toolbox to move.
                    </p>
                </section>

                <div
                    className="drawing-toolbox"
                    style={{
                        position: 'absolute',
                        left: toolboxPos.x,
                        top: toolboxPos.y,
                        cursor: isDraggingToolbox ? 'grabbing' : 'default',
                        background: 'white',
                        border: '1px solid #aaa',
                        borderRadius: 6,
                        padding: 12,
                        zIndex: 1000,
                        width: 250,
                        height: 480,
                        overflow: 'auto',
                    }}
                    onMouseMove={dragToolbox}
                    onMouseUp={stopToolboxDrag}
                    onMouseLeave={stopToolboxDrag}
                >
                    <div className="toolbox-header flex justify-between items-center">
                        <h3>Drawing Tools</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setMode('brush')} title="Brush">
                                <Brush size={18} />
                            </button>
                            <button onClick={() => setMode('eraser')} title="Eraser">
                                <Eraser size={18} />
                            </button>
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
                        <RgbaColorPicker color={color} onChange={setColor} />
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Brush Size</div>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                        />
                        <span>{brushSize}</span>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Recent Colors</div>
                        <div className="recent-colors">
                            {recentColors.map((c, i) => (
                                <button
                                    key={i}
                                    style={{ backgroundColor: c, width: 24, height: 24, margin: 2 }}
                                    onClick={() => {
                                        const rgbaMatch = c.match(/rgba?\((\d+), (\d+), (\d+), ([0-9.]+)\)/);
                                        if (rgbaMatch) {
                                            setColor({
                                                r: Number(rgbaMatch[1]),
                                                g: Number(rgbaMatch[2]),
                                                b: Number(rgbaMatch[3]),
                                                a: Number(rgbaMatch[4]),
                                            });
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <section
                    className="canvas-container"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            border: '2px solid #4d2d2d',
                            backgroundColor: '#f0f0f0',
                            cursor: isPanning ? 'grab' : mode === 'move' ? 'grab' : 'crosshair',
                        }}
                    ></canvas>

                    <div className="canvas-info-container">
                        <span>Zoom: {Math.round(zoom * 100)}%</span>
                        <span>Position: ({mousePos.x}, {mousePos.y})</span>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DemoCanvas;