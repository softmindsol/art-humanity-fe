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
    // This ref will store the precise distance from the box's top-left corner to the mouse click point.
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const infoBoxRef = useRef<HTMLDivElement>(null);

    // --- REDUX DATA ---
    const savedStrokes = useSelector(selectCanvasData);
    const savedStrokeCount = useMemo(() =>
        savedStrokes.filter((c: any) => c && c._id && !c._id.startsWith('temp_')).length,
        [savedStrokes]);

    // --- SIDE EFFECTS (Positioning) ---
    useEffect(() => {
        setIsMinimized(isSmallScreen);
    }, [isSmallScreen]);

    // This effect correctly sets the initial or programmatic position of the box.
    useEffect(() => {
        if (boundaryRef.current && infoBoxRef.current) {
            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
            let newX, newY;

            if (isMinimized) {
                newX = boundaryRect.width - infoBoxRect.width - 20;
                newY = 20; // Top-right
            } else {
                if (isSmallScreen) {
                    newX = 20;
                    newY = boundaryRect.height - infoBoxRect.height - 20; // Bottom-left
                } else {
                    newX = boundaryRect.width - infoBoxRect.width - 20;
                    newY = (boundaryRect.height / 2) - (infoBoxRect.height / 2); // Middle-right
                }
            }
            setPosition({ x: newX, y: newY });
        }
    }, [boundaryRef, isSmallScreen, isMinimized]);


    // --- SIMPLE & CORRECT DRAGGING LOGIC (UPDATED) ---

    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {

        // NAYA CODE: Ab yeh check nahi karega ke box minimized hai ya nahi
        if (!infoBoxRef.current) return;

        const infoBoxRect = infoBoxRef.current.getBoundingClientRect();
        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - infoBoxRect.left,
            y: e.clientY - infoBoxRect.top,
        };
        e.preventDefault();
    }, []); // Dependency array se `isMinimized` hata dein

    useEffect(() => {
        const handleDragMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boundaryRef.current || !infoBoxRef.current) return;

            const boundaryRect = boundaryRef.current.getBoundingClientRect();
            const infoBoxNode = infoBoxRef.current;

            // Calculate the new top-left position of the box in viewport coordinates
            const newX_viewport = e.clientX - dragOffsetRef.current.x;
            const newY_viewport = e.clientY - dragOffsetRef.current.y;

            // Convert viewport coordinates to be relative to the boundary container
            let newX = newX_viewport - boundaryRect.left;
            let newY = newY_viewport - boundaryRect.top;

            // Enforce boundaries to keep the box inside the container
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newX = Math.min(newX, boundaryRect.width - infoBoxNode.offsetWidth);
            newY = Math.min(newY, boundaryRect.height - infoBoxNode.offsetHeight);

            // Update the state directly. This is reliable and fast enough for this component.
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

    // --- RENDER ---
    return (
        <div
            ref={infoBoxRef}
            className="absolute bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723] shadow-lg select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: isMinimized ? 'auto' : '200px',
                visibility: position.x === 0 && position.y === 0 ? 'hidden' : 'visible',
                // Apply smooth transitions only when NOT dragging
                transition: isDragging ? 'none' : 'top 0.3s ease-in-out, left 0.3s ease-in-out, width 0.3s ease-in-out',
            }}
        >
            <div
                className="w-full flex justify-between items-center gap-5 mb-2"
                style={{ cursor: isMinimized ? 'default' : 'grab' }}
                onMouseDown={handleDragMouseDown}
            >
                <p className="text-[#3e2723] text-lg font-bold m-0">Infobox</p>
                <div className='flex text-[#3e2723] items-center gap-2'>
                    {isSmallScreen && (
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title={isMinimized ? "Maximize" : "Minimize"}
                        >
                            {isMinimized ? <Plus size={16} /> : <Minus size={16} />}
                        </button>
                    )}
                    <div className="cursor-grab active:cursor-grabbing">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </div>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div>Zoom: {Math.round(zoom * 100)}%</div>
                    <div>World Pos: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
                    <div>Contributions: {savedStrokeCount}</div>
                    {isSaving && <div className="text-orange-500 font-semibold mt-1">Saving...</div>}
                    {saveError && <div className="text-red-600 font-semibold mt-1">{saveError}</div>}
                </>
            )}
        </div>
    );
};

export default InfoBox;