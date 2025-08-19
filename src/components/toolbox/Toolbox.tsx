// src/components/Toolbox.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Brush, Eraser, Move } from 'lucide-react';

// Apne Redux slice se actions aur selectors import karein
import {
    setBrushMode,
    setBrushSize,
    setBrushColor
} from '@/redux/slice/contribution';
import { selectCurrentBrush } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';

const Toolbox = () => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);

    // --- DRAGGING LOGIC STATE & REFS ---
    const [position, setPosition] = useState({ x: 72, y: 320 }); // Toolbox ki shuruaati position
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 }); // Mouse aur toolbox ke kone ka faasla

    // --- DRAGGING EVENT HANDLERS ---
    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        // Toolbox ke kone se mouse ka faasla calculate karke save karein
        dragOffsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.preventDefault(); // Drag karte waqt text selection ko rokein
    }, [position]);

    // Global event listeners ko manage karne ke liye useEffect
    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            // Nayi position set karein
            setPosition({
                x: e.clientX - dragOffsetRef.current.x,
                y: e.clientY - dragOffsetRef.current.y,
            });
        };

        const handleDragMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleDragMouseMove);
            document.addEventListener('mouseup', handleDragMouseUp);
        }

        // Cleanup: Component unmount hone par ya dragging rukne par listeners hatayein
        return () => {
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging]);


    // --- COLOR LOGIC (Aapka pehle wala code) ---
    const hslToRgb = (h: number, s: number, l: number) => {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
            a: 1,
        };
    };

    const handleColorChange = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
        const hue = ((angle * 180) / Math.PI + 360) % 360;
        const newColor = hslToRgb(hue, 100, 50);
        dispatch(setBrushColor(newColor));
    };

    const currentColorString = `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a})`;


    
    return (
        <div
            className="absolute top-56 z-50 bg-white border border-[#8b795e] rounded-lg p-4 w-[250px] shadow-lg flex flex-col gap-4 select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default',
            }}
        >
            {/* Tools Header with Drag Handle */}
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-[#8b795e] text-lg font-semibold m-0">Tools</h3>
                <div
                    className="cursor-grab p-1"
                    title="Drag Toolbox"
                    onMouseDown={handleDragMouseDown} // Dragging yahan se shuru hogi
                >
                    {/* Simple Drag Handle Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
            </div>

            {/* Brush / Eraser / Move */}
            <div className="flex gap-2">
                {(['brush', 'eraser', 'move'] as const).map((mode) => {
                    const Icon = mode === 'brush' ? Brush : mode === 'eraser' ? Eraser : Move;
                    const isActive = brushState.mode === mode;
                    return (
                        <button
                            key={mode}
                            onClick={() => dispatch(setBrushMode(mode))}
                            title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                            className={`flex-1 p-2 border border-[#8b795e] rounded flex justify-center transition-colors ${isActive ? 'bg-[#8b795e] text-white' : 'bg-white text-[#8b795e] hover:bg-gray-200'}`}
                        >
                            <Icon size={18} />
                        </button>
                    );
                })}
            </div>

            {/* Color Picker */}
            <div>
                <label className="text-sm font-bold text-[#8b795e] mb-2 block">Color</label>
                <div
                    className="relative w-[150px] h-[150px] mx-auto rounded-full cursor-pointer border-2 border-gray-300"
                    style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
                    onClick={handleColorChange}
                >
                    <div
                        className="absolute w-[40px] h-[40px] rounded-full border-4 border-white shadow-md"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: currentColorString,
                        }}
                    />
                </div>
            </div>

            {/* Brush Size Slider */}
            <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Brush Size: {brushState.size}px</label>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushState.size}
                    onChange={(e) => dispatch(setBrushSize(Number(e.target.value)))}
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default Toolbox;