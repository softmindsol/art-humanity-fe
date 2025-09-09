import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GripVertical, Minus, Plus } from 'lucide-react'; // Handle ke liye icon
import { selectCanvasData } from '@/redux/slice/contribution';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@/hook/useMediaQuery';



const InfoBox = ({ zoom, worldPos, isSaving, saveError, boundaryRef }: any) => {
    // --- MINIMIZE LOGIC ---
    const [isMinimized, setIsMinimized] = useState(false);
    const isSmallScreen = useMediaQuery(1440);

    const [position, setPosition] = useState(() => {
        // Shuru mein boundaryRef shayad na ho, isliye window ka size istemal karein
        const initialBoundary = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        if (isSmallScreen) {
            // Choti screen par, bottom-left mein
            return { x: 20, y: initialBoundary.height - 80 };
        } else {
            // Bari screen par, bottom-right mein
            return { x: initialBoundary.width - 220, y: initialBoundary.height - 150 };
        }
    });    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 }); // Mouse aur box ke kone ka faasla
    const savedStrokes = useSelector(selectCanvasData);
    const infoBoxRef = useRef<HTMLDivElement>(null); // InfoBox ka apna ref



    useEffect(() => {
        if (!isSmallScreen) {
            setIsMinimized(false);
        }
        else {
            setIsMinimized(true);
        }
    }, [isSmallScreen]);
    const savedStrokeCount = useMemo(() =>
        savedStrokes.filter((c: any) => c && c._id && !c._id.startsWith('temp_')).length
        , [savedStrokes]);

    useEffect(() => {
        if (boundaryRef.current && infoBoxRef.current) {
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
            // Toolbox ko parent ke andar, bottom-right mein rakhein
            setPosition({
                x: boundaryRect.width - infoBoxRect.width - 20, // 20px from right
                y: boundaryRect.height - infoBoxRect.height - 20, // 20px from bottom
            });
        }
    }, [boundaryRef]);


    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        if (!infoBoxRef.current) return;
        const infoBoxRect = infoBoxRef.current.getBoundingClientRect();

        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - infoBoxRect.left,
            y: e.clientY - infoBoxRect.top,
        };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boundaryRef.current || !infoBoxRef.current) return;

            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxRect = infoBoxRef.current.getBoundingClientRect();

            let newX_viewport = e.clientX - dragOffsetRef.current.x;
            let newY_viewport = e.clientY - dragOffsetRef.current.y;

            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;

            // Boundary checks
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - infoBoxRect.width);
            newY = Math.min(newY, boundaryRect.height - infoBoxRect.height);

            setPosition({ x: newX, y: newY });
        };

        const handleDragMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleDragMouseMove);
            document.addEventListener('mouseup', handleDragMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMouseMove);
            document.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging, boundaryRef]);

    return (
        <div>

        
        <div
            ref={infoBoxRef}

            className="absolute bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723] shadow-lg w-[200px] select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default', // Cursor change karein
                width: isMinimized && isSmallScreen ? 'auto' : '200px'

            }}
        >
            {/* Drag Handle (Bilkul Toolbox jaisa) */}
            <div
                className="w-full flex justify-between items-center gap-5 mb-2 cursor-grab active:cursor-grabbing text-gray-400"
            >
                <p className="text-[#3e2723] text-lg font-bold m-0">Infobox</p>
                <div className='flex items-center gap-2'>
                    <div onMouseDown={handleDragMouseDown} // Dragging yahan se shuru hogi
                    >
                        <GripVertical size={20} />
                    </div>
                    {isSmallScreen && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Taake button click par dragging shuru na ho
                                setIsMinimized(!isMinimized);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title={isMinimized ? "Maximize" : "Minimize"}
                        >
                            {isMinimized ? <Plus size={16} /> : <Minus size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div>Zoom: {Math.round(zoom * 100)}%</div>
                    <div>World Pos: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
                    <div>Strokes: {savedStrokeCount}</div>
                    {isSaving && <div className="text-orange-500 font-semibold mt-1">Saving...</div>}
                    {saveError && <div className="text-red-600 font-semibold mt-1">{saveError}</div>}
                </>
            )}

            </div></div>
    );
};

export default InfoBox;