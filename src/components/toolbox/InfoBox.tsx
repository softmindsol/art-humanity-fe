import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GripVertical } from 'lucide-react'; // Handle ke liye icon
import { selectCanvasData } from '@/redux/slice/contribution';
import { useSelector } from 'react-redux';

interface InfoBoxProps {
    zoom: number;
    worldPos: { x: number; y: number };
    strokeCount: number;
    isSaving: boolean;
    saveError: string | null;
}

const InfoBox = ({ zoom, worldPos, strokeCount, isSaving, saveError }: InfoBoxProps) => {
    // --- DRAGGING LOGIC STATE & REFS ---
    const [position, setPosition] = useState({ x: window.innerWidth - 220, y: window.innerHeight - 150 }); // Shuruaati position right-bottom corner ke qareeb
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 }); // Mouse aur box ke kone ka faasla
    const savedStrokes = useSelector(selectCanvasData);

    // --- DRAGGING EVENT HANDLERS ---
    const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        // Box ke kone se mouse ka faasla calculate karke save karein
        dragOffsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.preventDefault(); // Drag karte waqt text selection ko rokein
    }, [position]);

    const savedStrokeCount = useMemo(() =>
        savedStrokes.filter((c: any) => c && c._id && !c._id.startsWith('temp_')).length
        , [savedStrokes]);

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
            window.addEventListener('mousemove', handleDragMouseMove);
            window.addEventListener('mouseup', handleDragMouseUp);
        }

        // Cleanup: Component unmount hone par ya dragging rukne par listeners hatayein
        return () => {
            window.removeEventListener('mousemove', handleDragMouseMove);
            window.removeEventListener('mouseup', handleDragMouseUp);
        };
    }, [isDragging]);


    return (
        <div
            className="absolute bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723] shadow-lg w-[200px] select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default', // Cursor change karein
            }}
        >
            {/* Drag Handle (Bilkul Toolbox jaisa) */}
            <div
                className="w-full flex justify-between items-center mb-2 cursor-grab active:cursor-grabbing text-gray-400"
                onMouseDown={handleDragMouseDown} // Dragging yahan se shuru hogi
            >
                <p className="text-[#3e2723] text-lg font-bold m-0">Infobox</p>
                <div> <GripVertical size={20} /></div>
            </div>

            {/* Aapka baqi content */}
            <div>Zoom: {Math.round(zoom * 100)}%</div>
            <div>World Pos: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
            <div>Strokes: {savedStrokeCount}</div>
            {isSaving && <div className="text-orange-500 font-semibold mt-1">Saving...</div>}
            {saveError && <div className="text-red-600 font-semibold mt-1">{saveError}</div>}
        </div>
    );
};

export default InfoBox;