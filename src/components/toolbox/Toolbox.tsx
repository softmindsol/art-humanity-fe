// src/components/Toolbox.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Brush, Eraser, Move, Minus, Plus, Baseline, Pipette } from 'lucide-react';
import {
    setBrushColor,
    setCurrentBrush,
    setBrushSize,
    selectRecentColors,
    addRecentColor
} from '@/redux/slice/contribution';
import { selectCurrentBrush } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import { useMediaQuery } from '@/hook/useMediaQuery';



const Toolbox = ({ boundaryRef }: any) => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const recentColors = useSelector(selectRecentColors);
    const [position, setPosition] = useState({ x: 100, y: 400 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const toolboxRef = useRef<HTMLDivElement>(null);
    const colorWheelRef = useRef<HTMLDivElement>(null);
    const [isDraggingColor, setIsDraggingColor] = useState(false);
    const brushStateRef = useRef(brushState);

    console.log('[Toolbox] Component rendered. Recent Colors:', recentColors);

    // Keep brushState ref updated for event handlers
    useEffect(() => {
        brushStateRef.current = brushState;
    }, [brushState]);
    // --- MINIMIZE LOGIC ---
    const [isMinimized, setIsMinimized] = useState(false);
    const isSmallScreen = useMediaQuery(1440); // 1440px par check karega





    // const handleColorFinalized = (hslColor: any) => {
    //     // Dispatch the action to add this color to the recent colors list
    //     // dispatch(addRecentColor(hslColor));
    // };
    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        if (!toolboxRef.current) return;
        const toolboxRect = toolboxRef.current.getBoundingClientRect();
        setIsDragging(true);
        dragOffsetRef.current = {
            x: clientX - toolboxRect.left,
            y: clientY - toolboxRect.top,
        };
    }, []);

    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
        e.preventDefault();
    }, [handleDragStart]);

    const handleDragTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
        e.preventDefault(); // Stop creating mouse event
    }, [handleDragStart]);

    useEffect(() => {
        const handleDragMove = (clientX: number, clientY: number) => {
            if (!isDragging || !boundaryRef?.current || !toolboxRef.current) return;
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const toolboxRect = toolboxRef.current.getBoundingClientRect();
            let newX_viewport = clientX - dragOffsetRef.current.x;
            let newY_viewport = clientY - dragOffsetRef.current.y;
            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - toolboxRect.width);
            newY = Math.min(newY, boundaryRect.height - toolboxRect.height);
            setPosition({ x: newX, y: newY });
        };

        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientX, touch.clientY);
            e.preventDefault();
        };

        const handleDragEnd = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, boundaryRef]);

    // Jab screen bari ho jaye to toolbox ko aape se maximize kar dein
    useEffect(() => {
        if (!isSmallScreen) {
            setIsMinimized(false);
        }
        else {
            setIsMinimized(true);
            setPosition({ x: 100, y: 60 });
        }

    }, [isSmallScreen]);

    const hslToRgb = (h: number, s: number, l: number) => {
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
    };


    const calculateColorFromPosition = (clientX: number, clientY: number) => {
        if (!colorWheelRef.current) return null;
        const rect = colorWheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Hue (Angle) - 0deg at top
        const angleInRadians = Math.atan2(dx, -dy);
        let hue = (angleInRadians * 180) / Math.PI;
        if (hue < 0) hue += 360;

        // Saturation (Distance)
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = rect.width / 2;
        const saturation = Math.min(100, (distance / maxRadius) * 100);

        return { h: hue, s: saturation };
    };

    // --- MOUSE HANDLER ---
    const handleColorMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingColor(true);
        const newColor = calculateColorFromPosition(e.clientX, e.clientY);
        if (newColor) {
            dispatch(setBrushColor(newColor));
        }
    };

    // --- TOUCH HANDLER ---
    const handleColorTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent scroll while touching color wheel
        const touch = e.touches[0];
        setIsDraggingColor(true);
        const newColor = calculateColorFromPosition(touch.clientX, touch.clientY);
        if (newColor) {
            dispatch(setBrushColor(newColor));
        }
    };


    useEffect(() => {
        const handleColorMouseMove = (e: MouseEvent) => {
            if (isDraggingColor) {
                const newColor = calculateColorFromPosition(e.clientX, e.clientY);
                if (newColor) {
                    dispatch(setBrushColor(newColor));
                }
            }
        };

        const handleColorMouseUp = (e: MouseEvent) => {
            if (isDraggingColor) {
                setIsDraggingColor(false);
                const newColor = calculateColorFromPosition(e.clientX, e.clientY);
                if (newColor) {
                    // Combine with current lightness
                    const finalColor = {
                        ...brushStateRef.current.color,
                        h: newColor.h,
                        s: newColor.s
                    };
                    // handleColorFinalized(finalColor);
                }
            }
        };

        const handleColorTouchMove = (e: TouchEvent) => {
            if (isDraggingColor) {
                const touch = e.touches[0];
                const newColor = calculateColorFromPosition(touch.clientX, touch.clientY);
                if (newColor) {
                    dispatch(setBrushColor(newColor));
                }
            }
        };

        const handleColorTouchEnd = () => {
            setIsDraggingColor(false);
            // Logic currently commented out in main handler, so leaving blank or mirroring mouseUp logic if needed
        };

        if (isDraggingColor) {
            window.addEventListener('mousemove', handleColorMouseMove);
            window.addEventListener('mouseup', handleColorMouseUp);
            window.addEventListener('touchmove', handleColorTouchMove, { passive: false });
            window.addEventListener('touchend', handleColorTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleColorMouseMove);
            window.removeEventListener('mouseup', handleColorMouseUp);
            window.removeEventListener('touchmove', handleColorTouchMove);
            window.removeEventListener('touchend', handleColorTouchEnd);
        };
    }, [isDraggingColor]);

    const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const lightness = Number(e.target.value);
        dispatch(setBrushColor({ l: lightness }));
        // handleColorFinalized({ ...brushState.color, l: lightness });

    };
    const handleRecentColorClick = (hslColor: any) => {
        dispatch(setBrushColor(hslColor));
    };
    // Mojooda HSL color ko RGB string mein convert karein taake preview mein dikha sakein
    const rgbColor = hslToRgb(brushState.color.h, brushState.color.s, brushState.color.l);
    const currentColorString = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 1)`;

    // Lightness slider ke background ke liye dynamic gradient banayein
    const lightnessGradient = `linear-gradient(to right, black, hsl(${brushState.color.h}, 100%, 50%), white)`;


    return (
        <div
            ref={toolboxRef}
            className="absolute z-30 bg-white border border-[#8b795e] rounded-lg p-4 w-[250px] shadow-lg flex flex-col gap-4 select-none"
            style={{ left: `${position.x}px`, top: `${position.y}px`, cursor: 'default' }}
        >
            <div
                className="flex justify-between items-center border-b pb-2 "
            >
                <h3 className="text-[#8b795e] text-lg font-semibold m-0">Tools</h3>
                <div className='flex items-center gap-x-2'>
                    {isSmallScreen && (
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title={isMinimized ? "Maximize" : "Minimize"}
                        >
                            {isMinimized ? <Plus size={18} /> : <Minus size={18} />}
                        </button>
                    )}
                    <div title="Drag Toolbox" className='cursor-grab active:cursor-grabbing' onMouseDown={handleDragMouseDown} onTouchStart={handleDragTouchStart} style={{ touchAction: 'none' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </div>

                </div>

            </div>

            {!isMinimized &&
                <div className='flex flex-col gap-4'>
                    <div className="flex gap-2">
                        {(['brush', 'eraser', 'line', 'picker'] as const).map((mode) => {
                            const Icon = { brush: Brush, eraser: Eraser, line: Baseline, picker: Pipette }[mode];
                            const isActive = brushState.mode === mode;
                            return (
                                <button key={mode} onClick={() => dispatch(setCurrentBrush({ mode }))} title={mode.charAt(0).toUpperCase() + mode.slice(1)} className={`flex-1 p-2 border border-[#8b795e] rounded flex justify-center transition-colors ${isActive ? 'bg-[#8b795e] text-white' : 'bg-white text-[#8b795e] hover:bg-gray-200'}`}>
                                    <Icon size={18} />
                                </button>
                            );
                        })}


                    </div>
                    {recentColors.length > 0 && (
                        <div>
                            <label className="text-sm font-bold !text-[#212121] mb-2 block">Recent Colors</label>
                            <div className="grid grid-cols-5 gap-2">
                                {recentColors.map((hslColor: any, index: any) => {
                                    const rgb = hslToRgb(hslColor.h, hslColor.s, hslColor.l);
                                    const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                                    const isActive =
                                        Math.round(hslColor.h) === Math.round(brushState.color.h) &&
                                        hslColor.s === brushState.color.s &&
                                        hslColor.l === brushState.color.l;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleRecentColorClick(hslColor)}
                                            className={`
                                                w-full h-8 rounded border cursor-pointer transition-all duration-150 ease-in-out
                                                ${isActive
                                                    ? 'ring-2 ring-offset-1 ring-blue-500 transform scale-110 shadow-lg' // Active state ki classes
                                                    : 'border-gray-300 hover:scale-105' // Normal state ki classes
                                                }
                                            `}
                                            style={{ backgroundColor: bgColor }}
                                            title={`Select color (H:${Math.round(hslColor.h)}, S:${hslColor.s}, L:${hslColor.l})`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-bold !text-[#212121] mb-2 block">Color</label>
                        <div
                            ref={colorWheelRef}
                            className="relative w-[150px] h-[150px] mx-auto rounded-full cursor-crosshair border-2 border-gray-300"
                            style={{
                                background: 'radial-gradient(circle, white 0%, transparent 80%), conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                                touchAction: 'none'
                            }}
                            onMouseDown={handleColorMouseDown}
                            onTouchStart={handleColorTouchStart}
                        >
                            <div
                                className="absolute w-[20px] h-[20px] rounded-full border-2 border-white shadow-md pointer-events-none"
                                style={{
                                    left: `${75 + ((brushState.color.s / 100) * 75) * Math.sin((brushState.color.h * Math.PI) / 180) - 10}px`, // 75(center) + x - 10(half-size)
                                    top: `${75 - ((brushState.color.s / 100) * 75) * Math.cos((brushState.color.h * Math.PI) / 180) - 10}px`,
                                    backgroundColor: currentColorString
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold !text-[#212121] mb-2 block">Shade (Lightness)</label>
                        <input
                            type="range"
                            min="0"  // 0% = Black
                            max="100" // 100% = White
                            value={brushState.color.l}
                            onChange={handleLightnessChange}
                            className="w-full shade-slider"
                            style={{ background: lightnessGradient }}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold !text-[#212121] mb-2 block">Brush Size: {brushState.size}px</label>
                        <input
                            type="range"
                            min="1"
                            max="25"
                            value={brushState.size}
                            onChange={(e) => dispatch(setBrushSize(Number(e.target.value)))}
                            className="w-full"
                        />
                    </div>
                    <style>{`
                    .shade-slider {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 15px;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                        outline: none;
                        cursor: pointer;
                    }
                    .shade-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid #5d4037; cursor: pointer; }
                    .shade-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid #5d4037; cursor: pointer; }
                `}</style>
                </div>}

        </div>
    );
};

export default Toolbox;