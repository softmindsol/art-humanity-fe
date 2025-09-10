// src/components/Toolbox.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Brush, Eraser, Move, Minus, Plus } from 'lucide-react';
import {
    setBrushColor,
    setCurrentBrush,
    setBrushSize
} from '@/redux/slice/contribution';
import { selectCurrentBrush } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import { useMediaQuery } from '@/hook/useMediaQuery';



const Toolbox = ({ boundaryRef }: any) => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);

    const [position, setPosition] = useState({ x: 100, y: 400 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const toolboxRef = useRef<HTMLDivElement>(null);

    // --- MINIMIZE LOGIC ---
    const [isMinimized, setIsMinimized] = useState(false);
    const isSmallScreen = useMediaQuery(1440); // 1440px par check karega

    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        if (!toolboxRef.current) return;
        const toolboxRect = toolboxRef.current.getBoundingClientRect();
        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - toolboxRect.left,
            y: e.clientY - toolboxRect.top,
        };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boundaryRef?.current || !toolboxRef.current) return;
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const toolboxRect = toolboxRef.current.getBoundingClientRect();
            let newX_viewport = e.clientX - dragOffsetRef.current.x;
            let newY_viewport = e.clientY - dragOffsetRef.current.y;
            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - toolboxRect.width);
            newY = Math.min(newY, boundaryRect.height - toolboxRect.height);
            setPosition({ x: newX, y: newY });
        };
        const handleDragMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMouseMove);
            document.addEventListener('mouseup', handleDragMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging, boundaryRef]);

    // Jab screen bari ho jaye to toolbox ko aape se maximize kar dein
    useEffect(() => {
        if (!isSmallScreen) {
            setIsMinimized(false);
        }
        else{
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

    const handleColorChange = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();

        // Step 1: Click ki position ko wheel ke center ke hisab se calculate karein
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clickX = e.clientX - centerX;
        const clickY = e.clientY - centerY;

        // ===== YEH NAYI AUR BEHTAR CALCULATION HAI =====
        // Step 2: atan2 ko aisy coordinates dein jo top se shuru hon aur clockwise ghumein
        const angleInRadians = Math.atan2(clickX, -clickY);

        // Step 3: Radians ko degrees mein convert karein
        let hue = (angleInRadians * 180) / Math.PI;

        // Step 4: Negative values ko positive banayein (0-360 range)
        if (hue < 0) {
            hue += 360;
        }

        const newColor = hslToRgb(hue, 100, 50);
        dispatch(setBrushColor(newColor));
    };

    const currentColorString = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;

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
                    <div title="Drag Toolbox" className='cursor-grab active:cursor-grabbing' onMouseDown={handleDragMouseDown}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </div>
                  
                </div>
               
            </div>

           {!isMinimized &&
            <div className=''>
            <div className="flex gap-2">
                {(['brush', 'eraser', 'line'] as const).map((mode) => {
                    const Icon = { brush: Brush, eraser: Eraser, line: Minus }[mode];
                    const isActive = brushState.mode === mode;
                    return (
                        <button key={mode} onClick={() => dispatch(setCurrentBrush({ mode }))} title={mode.charAt(0).toUpperCase() + mode.slice(1)} className={`flex-1 p-2 border border-[#8b795e] rounded flex justify-center transition-colors ${isActive ? 'bg-[#8b795e] text-white' : 'bg-white text-[#8b795e] hover:bg-gray-200'}`}>
                            <Icon size={18} />
                        </button>
                    );
                })}
                <button onClick={() => dispatch(setCurrentBrush({ mode: 'move' }))} title="Move" className={`flex-1 p-2 border border-[#8b795e] rounded flex justify-center transition-colors ${brushState.mode === 'move' ? 'bg-[#8b795e] text-white' : 'bg-white text-[#8b795e] hover:bg-gray-200'}`}>
                    <Move size={18} />
                </button>
            </div>

            <div>
                <label className="text-sm font-bold !text-[#212121] mb-2 block">Color</label>
                <div
                    className="relative w-[150px] h-[150px] mx-auto rounded-full cursor-pointer border-2 border-gray-300"
                    // Is CSS ko bilkul aisy hi rehne dein, red top par
                    style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
                    onClick={handleColorChange}
                >
                    <div
                        className="absolute w-[40px] h-[40px] rounded-full border-4 border-white shadow-md"
                        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: currentColorString }}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-bold !text-[#212121] mb-2 block">Brush Size: {brushState.size}px</label>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushState.size}
                    onChange={(e) => dispatch(setBrushSize(Number(e.target.value)))}
                    className="w-full"
                />
            </div></div>}
        </div>
    );
};

export default Toolbox;