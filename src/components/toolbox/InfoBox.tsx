import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { selectCanvasData } from '@/redux/slice/contribution';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@/hook/useMediaQuery';

const InfoBox = ({ zoom, worldPos, isSaving, saveError, boundaryRef }: any) => {
    // --- STATE MANAGEMENT ---
    const isSmallScreen = useMediaQuery(1440);
    const [isMinimized, setIsMinimized] = useState(isSmallScreen);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const infoBoxRef = useRef<HTMLDivElement>(null);

    // --- REDUX DATA ---
    const savedStrokes = useSelector(selectCanvasData);
    const savedStrokeCount = useMemo(() =>
        savedStrokes.filter((c: any) => c && c._id && !c._id.startsWith('temp_')).length,
        [savedStrokes]);

    // --- SIDE EFFECTS ---

    // Effect to auto-minimize/maximize when screen size crosses the breakpoint
    useEffect(() => {
        setIsMinimized(isSmallScreen);
    }, [isSmallScreen]);

    // --- THIS IS THE FINAL UPDATED POSITIONING LOGIC ---
    // This effect now handles all positioning rules based on screen size and minimized state.
    useEffect(() => {
        if (boundaryRef.current && infoBoxRef.current) {
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxRect = infoBoxRef.current.getBoundingClientRect();

            // Rule 1: Agar box MINIMIZED hai, to hamesha TOP-RIGHT par rakho.
            if (isMinimized) {
                setPosition({
                    x: boundaryRect.width - infoBoxRect.width - 20, // 20px from right
                    y: 20  // 20px from top
                });
                return; // Baaqi logic ko skip kar do
            }

            // Rule 2: Agar box MAXIMIZED hai, to screen size ke hisaab se position set karo.
            let newX, newY;
            if (isSmallScreen) {
                // Choti screen par, bottom-left
                newX = 20;
                newY = boundaryRect.height - infoBoxRect.height - 20;
            } else {
                // Bari screen par, middle-right (default maximized position)
                newX = boundaryRect.width - infoBoxRect.width - 20;
                newY = (boundaryRect.height / 2) - (infoBoxRect.height / 2);
            }
            setPosition({ x: newX, y: newY });
        }
        // Yeh effect ab `isMinimized` ke badalne par bhi chalega.
    }, [boundaryRef, isSmallScreen, isMinimized]);


    // --- DRAGGING LOGIC ---

    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        // Dragging ko disable karein agar box minimized hai
        if (isMinimized) return;

        if (!infoBoxRef.current) return;
        const infoBoxRect = infoBoxRef.current.getBoundingClientRect();

        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - infoBoxRect.left,
            y: e.clientY - infoBoxRect.top,
        };
        e.preventDefault();
    }, [isMinimized]); // isMinimized ko dependency banayein

    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boundaryRef.current || !infoBoxRef.current) return;
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
            let newX_viewport = e.clientX - dragOffsetRef.current.x;
            let newY_viewport = e.clientY - dragOffsetRef.current.y;
            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - infoBoxRect.width);
            newY = Math.min(newY, boundaryRect.height - infoBoxRect.height);
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

    // --- RENDER ---
    return (
        <div
            ref={infoBoxRef}
            className="absolute bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723] shadow-lg select-none transition-all duration-300 ease-in-out"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: isMinimized ? 'auto' : '200px',
                visibility: position.x === 0 && position.y === 0 ? 'hidden' : 'visible'
            }}
        >
            <div
                className="w-full flex justify-between items-center gap-5 mb-2"
                // Drag handle par cursor style set karein
                
                onMouseDown={handleDragMouseDown}
            >
                <p className="text-[#3e2723] text-lg font-bold m-0">Infobox</p>
                <div className='flex text-[#3e2723] items-center gap-2'>
                    {isSmallScreen && (
                        <button
                        
                            onClick={(e) => {
                                // e.stopPropagation() ki ab zaroorat nahin
                                setIsMinimized(!isMinimized);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title={isMinimized ? "Maximize" : "Minimize"}
                        >
                            {isMinimized ? <Plus size={16} /> : <Minus size={16} />}
                        </button>
                    )}
                    {/* Drag Handle SVG */}
                    <div className="cursor-grab active:cursor-grabbing">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Info Content - Conditional Rendering */}
            {!isMinimized && (
                <>
                    <div>Zoom: {Math.round(zoom * 100)}%</div>
                    <div>World Pos: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
                    <div>Strokes: {savedStrokeCount}</div>
                    {isSaving && <div className="text-orange-500 font-semibold mt-1">Saving...</div>}
                    {saveError && <div className="text-red-600 font-semibold mt-1">{saveError}</div>}
                </>
            )}
        </div>
    );
};

export default InfoBox;