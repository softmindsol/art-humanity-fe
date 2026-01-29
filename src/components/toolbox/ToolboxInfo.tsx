// src/components/Toolbox.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Brush, Eraser, Baseline, Pipette, ChevronDown, Type, Circle } from 'lucide-react';
import {
    setBrushColor,
    setCurrentBrush,
    setBrushSize,
    selectRecentColors,
    selectCurrentBrush
} from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import { useMediaQuery } from '@/hook/useMediaQuery';

const Toolbox = ({ boundaryRef }: any) => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const recentColors = useSelector(selectRecentColors);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const toolboxRef = useRef<HTMLDivElement>(null);
    const brushStateRef = useRef(brushState);

    // Popover States
    const [activePopover, setActivePopover] = useState<'brush' | 'color' | null>(null);
    const [isDraggingColor, setIsDraggingColor] = useState(false);
    const colorBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        brushStateRef.current = brushState;
    }, [brushState]);

    // --- DRAGGING LOGIC ---
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
        // Only drag if clicking the container or dots, not buttons or inputs
        if ((e.target as HTMLElement).closest('button, input')) return;
        handleDragStart(e.clientX, e.clientY);
        e.preventDefault();
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
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, boundaryRef]);

    // --- HELPERS ---
    const hslToRgb = (h: number, s: number, l: number) => {
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
    };

    const rgbColor = hslToRgb(brushState.color.h, brushState.color.s, brushState.color.l);
    const currentColorString = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 1)`;
    const lightnessGradient = `linear-gradient(to right, black, hsl(${brushState.color.h}, 100%, 50%), white)`;

    // --- COLOR PICKER LOGIC (SQUARE + HUE SLIDER) ---
    // Mapping: Square X = Saturation (0-100), Square Y = Lightness (100-0)
    // Note: This is an approximation of a visual picker.
    const calculateColorFromSquare = (clientX: number, clientY: number) => {
        if (!colorBoxRef.current) return null;
        const rect = colorBoxRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

        const saturation = (x / rect.width) * 100;
        // Lightness: Top(0) is 100, Bottom(Height) is 0
        const lightness = 100 - ((y / rect.height) * 100);

        return { s: saturation, l: lightness };
    };

    const handleColorBoxMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingColor(true);
        const sl = calculateColorFromSquare(e.clientX, e.clientY);
        if (sl) dispatch(setBrushColor({ s: sl.s, l: sl.l }));
    };

    const handleColorHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setBrushColor({ h: Number(e.target.value) }));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingColor && activePopover === 'color') {
                const sl = calculateColorFromSquare(e.clientX, e.clientY);
                if (sl) dispatch(setBrushColor({ s: sl.s, l: sl.l }));
            }
        };
        const handleMouseUp = () => setIsDraggingColor(false);

        if (isDraggingColor) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingColor, activePopover]);

    // --- POPOVER TOGGLERS ---
    const toggleBrushPopover = () => setActivePopover(activePopover === 'brush' ? null : 'brush');
    const toggleColorPopover = () => setActivePopover(activePopover === 'color' ? null : 'color');

    // Close popovers when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolboxRef.current && !toolboxRef.current.contains(e.target as Node)) {
 
                setActivePopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- RENDER ---
    return (
        <div
            ref={toolboxRef}
            className="absolute z-40 bg-[#0F0D0D] border border-white/10 rounded-[12px] p-2 shadow-2xl flex items-center gap-3 select-none backdrop-blur-md"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onMouseDown={handleDragMouseDown}
        >
            {/* Drag Handle (Dots) */}
            <div className="cursor-grab active:cursor-grabbing px-2 text-white/20 hover:text-white/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="4" r="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="8" cy="20" r="2" />
                    <circle cx="16" cy="4" r="2" />
                    <circle cx="16" cy="12" r="2" />
                    <circle cx="16" cy="20" r="2" />
                </svg>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-1">
                {/* Brush Tool */}
                <div className="relative group">
                    <button
                        onClick={() => {
                            dispatch(setCurrentBrush({ mode: 'brush' }));
                            if (activePopover !== 'brush') setActivePopover('brush');
                        }}
                        className={`p-2 rounded-lg flex items-center gap-1 transition-all ${brushState.mode === 'brush'
                            ? ' text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {/* <Brush size={20} /> */}
                        <img src="/assets/brush.svg" alt="Brush" className="w-5 h-5" />
                        {brushState.mode === 'brush' && (
                            <ChevronDown size={14} className="opacity-80" onClick={(e) => {
                                e.stopPropagation();
                                toggleBrushPopover();
                            }} />
                        )}
                    </button>

                    {/* Brush Popover */}
                    {activePopover === 'brush' && (
                        <div className="absolute top-full left-0 mt-3 w-[176px] bg-[#1D1D1D] border border-white/10 rounded-[12px] px-2 py-2 shadow-xl animate-in fade-in slide-in-from-top-2 z-50">
                            <label className="text-white text-[12px] font-medium block">
                                Brush Size: {brushState.size}px
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushState.size}
                                onChange={(e) => dispatch(setBrushSize(Number(e.target.value)))}
                                className="w-full h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FEC133] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                                style={{
                                    background: `linear-gradient(to right, #E23373 0%, #E23373 ${((brushState.size - 1) / 49) * 100}%, rgba(255,255,255,0.1) ${((brushState.size - 1) / 49) * 100}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Text Tool (Placeholder/Visual only as requested design) */}
                <button
                    className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    title="Text (Coming Soon)"
                >
                    <Type size={20} />
                </button>              

                {/* Eraser */}
                <button
                    onClick={() => dispatch(setCurrentBrush({ mode: 'eraser' }))}
                    className={`p-2 rounded-lg transition-all ${brushState.mode === 'eraser'
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Eraser size={20} />
                </button>         
            </div>

            {/* Color Trigger & Popover */}
            <div className="relative">
                <button
                    onClick={toggleColorPopover}
                    className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-all shadow-md ${activePopover === 'color' ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                        }`}
                    style={{
                        background: 'linear-gradient(135deg, #FF5290 0%, #FFB347 100%)' // Pink-Orange Gradient Base
                    }}
                >
                    {/* Rainbow Ring (Masked to be a border/ring) */}
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                            background: `conic-gradient(from 0deg, #FF9797, #8288FF, #FFE26C, #92FF57, #4DC9A1, #729BA6, #FF9797)`,
                            WebkitMask: 'radial-gradient(closest-side, transparent 60%, black 62%)',
                            mask: 'radial-gradient(closest-side, transparent 60%, black 62%)'
                        }}
                    >
                    </div>
                </button>

                {/* Color Popover */}
                {activePopover === 'color' && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-[#1D1D1D] border border-white/10 rounded-[12px] p-4 shadow-xl animate-in fade-in slide-in-from-top-2 z-50 flex flex-col gap-4">

                        {/* Saturation/Lightness Square */}
                        <div
                            ref={colorBoxRef}
                            className="w-full h-40 rounded-lg cursor-crosshair relative shadow-inner overflow-hidden"
                            style={{
                                backgroundColor: `hsl(${brushState.color.h}, 100%, 50%)`,
                                backgroundImage: `
                                    linear-gradient(to top, black, transparent),
                                    linear-gradient(to right, white, transparent)
                                `,
                                touchAction: 'none'
                            }}
                            onMouseDown={handleColorBoxMouseDown}
                        >
                            {/* Cursor */}
                            <div
                                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${brushState.color.s}%`,
                                    top: `${100 - brushState.color.l}%`,
                                    backgroundColor: currentColorString
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    if ('EyeDropper' in window) {
                                        try {
                                            // @ts-ignore
                                            const eyeDropper = new window.EyeDropper();
                                            // @ts-ignore
                                            const result = await eyeDropper.open();
                                            const hex = result.sRGBHex;
                                            
                                            // Convert Hex to HSL
                                            let r = 0, g = 0, b = 0;
                                            if (hex.length === 4) {
                                                r = parseInt("0x" + hex[1] + hex[1]);
                                                g = parseInt("0x" + hex[2] + hex[2]);
                                                b = parseInt("0x" + hex[3] + hex[3]);
                                            } else if (hex.length === 7) {
                                                r = parseInt("0x" + hex[1] + hex[2]);
                                                g = parseInt("0x" + hex[3] + hex[4]);
                                                b = parseInt("0x" + hex[5] + hex[6]);
                                            }
                                            r /= 255;
                                            g /= 255;
                                            b /= 255;
                                            const cmin = Math.min(r, g, b),
                                                cmax = Math.max(r, g, b),
                                                delta = cmax - cmin;
                                            let h = 0,
                                                s = 0,
                                                l = 0;
                                            
                                            if (delta === 0) h = 0;
                                            else if (cmax === r) h = ((g - b) / delta) % 6;
                                            else if (cmax === g) h = (b - r) / delta + 2;
                                            else h = (r - g) / delta + 4;
                                            
                                            h = Math.round(h * 60);
                                            if (h < 0) h += 360;
                                            
                                            l = (cmax + cmin) / 2;
                                            s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
                                            s = +(s * 100).toFixed(1);
                                            l = +(l * 100).toFixed(1);

                                            dispatch(setBrushColor({ h, s, l }));
                                        } catch (e) {
                                            console.error("EyeDropper failed", e);
                                        }
                                    } else {
                                        alert("Your browser does not support the EyeDropper API");
                                    }
                                }}
                                className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                                title="Pick Color"
                            >
                                <img src="/assets/eye-dropper.svg" alt="Dropper" className="w-full h-full object-contain" />
                            </button>

                            <div className="h-4 rounded-full flex-1 relative overflow-hidden">
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={brushState.color.h}
                                    onChange={handleColorHueChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute inset-0 w-full h-full" style={{
                                    background: 'linear-gradient(to right, #FF9797, #8288FF, #FFE26C, #92FF57, #4DC9A1, #729BA6, #FF4242)'
                                }} />
                                <div
                                    className="absolute h-full w-1 bg-white border border-black/20 shadow pointer-events-none z-0"
                                    style={{ left: `${(brushState.color.h / 360) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Recent Colors */}
                        {recentColors.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/10">
                                {recentColors.map((hslColor: any, index: number) => {
                                    const rgb = hslToRgb(hslColor.h, hslColor.s, hslColor.l);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => dispatch(setBrushColor(hslColor))}
                                            className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})` }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toolbox;