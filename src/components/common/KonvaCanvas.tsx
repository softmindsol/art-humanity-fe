import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

// Apne Redux actions aur slices ke ahem imports
import { getContributionsByProject, batchCreateContributions } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData, addMultipleContributionsOptimistically } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// Helper function ka import
import { transformContributionForKonva } from '@/utils/transformContributionForKonva';

// Props ke liye interface (apne project ke hisab se isay ahem banayein)
interface KonvaCanvasProps {
    projectId: string;
    userId: string;
    width: number;
    height: number;
    onStateChange: (state: any) => void;
    selectedContributionId: string | null;
    onGuestInteraction: () => void;
    isReadOnly: boolean;
    isContributor: boolean;
    socket: any;
}

const KonvaCanvas = ({
    projectId, userId, width, height, onStateChange, selectedContributionId,
    onGuestInteraction, isReadOnly, isContributor, socket
}: KonvaCanvasProps) => {

    // --- Hooks ---
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);
    const { user } = useAuth();

    // --- State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [stageState, setStageState] = useState({ scale: 1, x: 0, y: 0 });
    const [activeLine, setActiveLine] = useState<any>({ points: [] });
    const [bakedImage, setBakedImage] = useState<HTMLImageElement | null>(null);

    // --- Refs ---
    const currentStrokePathRef = useRef<any[]>([]);
    const strokeQueueRef = useRef<any[]>([]);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);


    const memoizedTransformContributionForKonva = useCallback((contribution: any) => {
        return transformContributionForKonva(contribution);
    }, []); // Transform function ko memoize karein

    useEffect(() => {
        if (!savedStrokes || width === 0 || height === 0) {
            setBakedImage(null);
            return;
        }

        console.log("[Canvas Bake] Re-drawing all contributions...");

        // 1. Offscreen Canvas banayein
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return; // Error Check
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // 2. Create image
        const image = new window.Image();
        image.onload = () => {
            setBakedImage(image);
        };

        drawAllStrokes(ctx);
        image.src = offscreenCanvas.toDataURL();

        // Ab jab bhi savedStrokes change honge, yeh turant render ho jayega
    }, [savedStrokes, width, height]);

    const drawAllStrokes = useCallback((ctx: any) => {
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        savedStrokes.forEach((contribution: any) => {
            if (contribution && contribution.strokes && Array.isArray(contribution.strokes)) {
                const konvaData = memoizedTransformContributionForKonva(contribution);
                konvaData.lines.forEach((line: any) => {
                    if (!line.points || line.points.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(line.points[0], line.points[1]);
                    for (let i = 2; i < line.points.length; i += 2) {
                        ctx.lineTo(line.points[i], line.points[i + 1]);
                    }
                    ctx.strokeStyle = line.stroke;
                    ctx.lineWidth = line.strokeWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalCompositeOperation = line.globalCompositeOperation;
                    ctx.stroke();
                });
            }
        });
    }, [savedStrokes, width, height, memoizedTransformContributionForKonva]);
    // --- Data Fetching ---
    useEffect(() => {
        if (projectId) {
            dispatch(getContributionsByProject({ projectId }));
        }
    }, [projectId, dispatch]);

    // --- CORE LOGIC: Offscreen Canvas Caching ---
    useEffect(() => {
        if (width === 0 || height === 0) return; // Agar canvas ka size nahi hai to kuch na karein

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        // 1. Create a sorted copy of the strokes array
        const sortedStrokes = savedStrokes
            ? [...savedStrokes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            : [];

        if (savedStrokes && savedStrokes.length > 0) {
            sortedStrokes.forEach((contribution: any) => {
                const konvaData = transformContributionForKonva(contribution);
                konvaData.lines.forEach((line: any) => {
                    if (!line.points || line.points.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(line.points[0], line.points[1]);
                    for (let i = 2; i < line.points.length; i += 2) {
                        ctx.lineTo(line.points[i], line.points[i + 1]);
                    }
                    ctx.strokeStyle = line.stroke;
                    ctx.lineWidth = line.strokeWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalCompositeOperation = line.globalCompositeOperation;
                    ctx.stroke();
                });
            });
        }

        const image = new window.Image();
        image.src = offscreenCanvas.toDataURL();
        image.onload = () => {
            setBakedImage(image);
        };
    }, [savedStrokes, width, height]);

    // --- Event Handlers ---

    const sendBatchToServer = useCallback(() => {
        if (strokeQueueRef.current.length > 0) {
            const contributionsToSend = [...strokeQueueRef.current];
            strokeQueueRef.current = [];
            dispatch(batchCreateContributions({ projectId, contributions: contributionsToSend }))
                .unwrap()
                .then((savedContributions: any[]) => {
                    savedContributions.forEach((contribution: any) => {
                        if (socket) socket.emit('new_drawing', { projectId, contribution });
                    });
                })
                .catch((err: any) => {
                    toast.error(err || "Could not save your drawing.");
                });
        }
    }, [dispatch, projectId, socket]);

    // --- Ye tamam handlers ab 'e' (event object) se stage hasil karte hain ---

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        // ... baaki ka wheel logic bilkul waisa hi rahega ...
        const scaleBy = 1.05;
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: (stage.getPointerPosition().x - stage.x()) / oldScale,
            y: (stage.getPointerPosition().y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const newState = {
            scale: newScale,
            x: stage.getPointerPosition().x - mousePointTo.x * newScale,
            y: stage.getPointerPosition().y - mousePointTo.y * newScale,
        };
        setStageState(newState);
        onStateChange({ zoom: newState.scale });
    };

    const handleMouseDown = (e: any) => {
        if (isReadOnly || !user) {
            if (!user) onGuestInteraction();
            return;
        }
        if (!isContributor) {
            toast.warning("You are not a contributor for this project.");
            return;
        }
        if (brushState.mode === 'move') return;

        setIsDrawing(true);
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        currentStrokePathRef.current = [];
        setActiveLine({
            points: [pos.x, pos.y],
            tool: brushState.mode,
            stroke: `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a || 1})`,
            strokeWidth: brushState.size,
        });
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        onStateChange({ worldPos: stage.getPointerPosition() });

        if (!isDrawing) return;

        const point = stage.getPointerPosition();
        const lastPoints = activeLine.points;
        setActiveLine((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));

        if (lastPoints.length >= 2) {
            const lastPoint = { x: lastPoints[lastPoints.length - 2], y: lastPoints[lastPoints.length - 1] };
            currentStrokePathRef.current.push({ fromX: lastPoint.x, fromY: lastPoint.y, toX: point.x, toY: point.y });
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStrokePathRef.current.length === 0) return;

        const tempId = `temp_${Date.now()}`;
        const optimisticContribution = {
            _id: tempId, projectId, userId: { _id: user?.id, fullName: user?.fullName },
            strokes: [{
                strokePath: [...currentStrokePathRef.current], brushSize: brushState.size,
                color: brushState.color, mode: brushState.mode
            }],
            // ... baaki optimistic data ...
        };
        dispatch(addMultipleContributionsOptimistically([optimisticContribution]));

        const backendContribution = {
            tempId, projectId, userId, strokes: optimisticContribution.strokes,
        };
        strokeQueueRef.current.push(backendContribution);

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);

        setActiveLine({ points: [] });
        currentStrokePathRef.current = [];
    };

    const highlightedLines = useMemo(() => {
        if (!selectedContributionId) return [];
        const selected = savedStrokes.find((c: any) => c._id === selectedContributionId);
        return selected ? transformContributionForKonva(selected).lines : [];
    }, [selectedContributionId, savedStrokes]);

    return (
        <Stage
            width={width} height={height}
            scaleX={stageState.scale} scaleY={stageState.scale}
            x={stageState.x} y={stageState.y}
            draggable={brushState.mode === 'move'}
            style={{ cursor: brushState.mode === 'move' ? 'grab' : 'crosshair' }}
        >
            <Layer>
                {bakedImage && <KonvaImage image={bakedImage} listening={false} />}
                {isDrawing && (
                    <Line
                        points={activeLine.points}
                        stroke={activeLine.stroke}
                        strokeWidth={activeLine.strokeWidth}
                        tension={0.5} lineCap="round" lineJoin="round"
                        globalCompositeOperation={activeLine.tool === 'eraser' ? 'destination-out' : 'source-over'}
                        listening={false}
                    />
                )}
            </Layer>

            <Layer listening={false}>
                {highlightedLines.map((line: any, i: number) => (
                    <Line key={`highlight-${i}`} {...line} shadowColor="rgba(0, 102, 255, 0.8)" shadowBlur={15} shadowOpacity={0.9}
 />
                ))}
            </Layer>

            <Layer>
                <Rect
                    width={width} height={height}
                    fill="transparent"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp} // Agar user canvas se bahar chala jaye to bhi drawing band kar do
                />
            </Layer>
        </Stage>
    );
};

export default React.memo(KonvaCanvas);