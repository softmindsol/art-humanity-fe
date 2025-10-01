import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

// Apne Redux actions aur slices ke ahem imports
import { getContributionsByProject, addStrokes } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData, selectActiveContributionId } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// Helper function ka import
import { transformContributionForKonva } from '@/utils/transformContributionForKonva';
import { getCanvasPointerPosition } from '@/utils/getCanvasPointerPosition';
import { incrementPixelCount } from '@/redux/slice/project';

// Props ke liye interface (apne project ke hisab se isay ahem banayein)

const KonvaCanvas = ({
    projectId, width, height, onStateChange, selectedContributionId,
    onGuestInteraction, isReadOnly, isContributor, virtualWidth, virtualHeight,
    onClearHighlight

}: any) => {

    // --- Hooks ---
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);
    const activeContributionId = useSelector(selectActiveContributionId); // <-- Get the active ID

    const { user } = useAuth();

    // --- State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeLine, setActiveLine] = useState<any>({ points: [] });
    const [bakedImage, setBakedImage] = useState<HTMLImageElement | null>(null);
    const lineStartPointRef = useRef<{ x: number; y: number } | any>(null);
    const [isPanning, setIsPanning] = useState(false);

    // --- Refs ---
    const currentStrokePathRef = useRef<any[]>([]);
    const strokeQueueRef = useRef<any[]>([]);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDrawingRef = useRef(isDrawing);
    const stageRef = useRef<any>(null);
    const panStartPointRef = useRef<any>({ x: 0, y: 0 });
    const lastPanPointRef = useRef<any>(null);

    // --- zoom in/out limit --- 
    const MAX_ZOOM = 32;
    const MIN_ZOOM = 0.1;


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

    // The single, authoritative baking hook

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




    useEffect(() => {
        if (projectId) {
            dispatch(getContributionsByProject({ projectId }));
        }
    }, [projectId, dispatch]);

    useEffect(() => {
        isDrawingRef.current = isDrawing;
    }, [isDrawing]);

    const isPointerInsideCanvas = (pos: { x: number; y: number }) => {
        return pos.x >= 0 && pos.y >= 0 && pos.x <= virtualWidth && pos.y <= virtualHeight;
    };


    const sendBatchToServer = useCallback(() => {
        // Agar queue khaali hai ya koi contribution active nahi hai, to kuch na karein
        if (strokeQueueRef.current.length === 0 || !activeContributionId) {
            return;
        }

        // --- BATCHING LOGIC ---
        // Queue mein mojood tamam strokes ko API call ke liye nikaal lein
        const strokesToSend = [...strokeQueueRef.current];
        strokeQueueRef.current = []; // Queue ko foran khaali kar dein

        console.log(`Sending a batch of ${strokesToSend.length} strokes to contribution ${activeContributionId}`);

        // Nayi `addStrokes` action ko dispatch karein
        dispatch(addStrokes({
            contributionId: activeContributionId,
            strokes: strokesToSend // Poora batch (strokes ka array) bhejein
        }))
            .unwrap()
            .catch((err) => {
                // Agar API call fail ho, to user ko batayein
                toast.error(`Failed to save drawing: ${err}`);
                // Optional: Failed strokes ko wapas queue mein daal dein taake dobara koshish ki ja sake
                // strokeQueueRef.current.push(...strokesToSend); 
            });

    }, [dispatch, activeContributionId]); // Dependency array ko update karein

    const startDrawing = (pos: any) => {


        if (isReadOnly || !isContributor || brushState.mode === 'move') return;
        if (!user) { onGuestInteraction(); return; }
        if (!isPointerInsideCanvas(pos)) return; // Agar pointer canvas ke bahar hai, drawing stop

        if (onClearHighlight) onClearHighlight();

        setIsDrawing(true);
        const { r, g, b, a } = brushState.color;
        const colorString = `rgba(${r},${g},${b},${a || 1})`;

        currentStrokePathRef.current = [];
        if (brushState.mode === 'line') {
            lineStartPointRef.current = pos;
            setActiveLine({ points: [pos.x, pos.y, pos.x, pos.y], tool: 'brush', stroke: colorString, strokeWidth: brushState.size });
        } else {
            setActiveLine({ points: [pos.x, pos.y], tool: brushState.mode, stroke: colorString, strokeWidth: brushState.size });
        }
    };

    const draw = (point: any) => {
        if (!isDrawing) return;
        if (!isPointerInsideCanvas(point)) return; // Agar pointer canvas ke bahar hai, drawing stop

        if (brushState.mode === 'line') {
            setActiveLine((prev: any) => ({ ...prev, points: [lineStartPointRef.current.x, lineStartPointRef.current.y, point.x, point.y] }));
        } else {
            setActiveLine((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));
            const lastPoints = activeLine.points;
            if (lastPoints.length >= 2) {
                const last = { x: lastPoints[lastPoints.length - 2], y: lastPoints[lastPoints.length - 1] };
                currentStrokePathRef.current.push({ fromX: last.x, fromY: last.y, toX: point.x, toY: point.y });
            }
        }
    };

    const stopDrawing = () => {
        // Agar drawing ho hi nahi rahi thi, to kuch na karo
        if (!isDrawing) return;
        setIsDrawing(false);

        // Line tool ke liye stroke path ko final karein
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            const startPoint = lineStartPointRef.current;
            const endPoint = activeLine.points.length > 2 ? { x: activeLine.points[2], y: activeLine.points[3] } : startPoint;
            currentStrokePathRef.current = [{ fromX: startPoint.x, fromY: startPoint.y, toX: endPoint.x, toY: endPoint.y }];
            lineStartPointRef.current = null;
        }

        // Agar sirf click hua tha (koi path nahi bana), to ruk jayein
        if (currentStrokePathRef.current.length === 0) {
            setActiveLine({ points: [] });
            return;
        }

        // Check karein ke koi contribution active hai ya nahi
        if (!activeContributionId) {
            toast.error("Please create or select a contribution first.");
            setActiveLine({ points: [] });
            currentStrokePathRef.current = [];
            return;
        }

        // --- INSTANT DRAW LOGIC ---
        // (Aapka yeh code bilkul theek hai)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = virtualWidth;
        tempCanvas.height = virtualHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            if (bakedImage) {
                ctx.drawImage(bakedImage, 0, 0);
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, virtualWidth, virtualHeight);
            }
            ctx.beginPath();
            ctx.moveTo(activeLine.points[0], activeLine.points[1]);
            for (let i = 2; i < activeLine.points.length; i += 2) ctx.lineTo(activeLine.points[i], activeLine.points[i + 1]);
            ctx.strokeStyle = activeLine.stroke;
            ctx.lineWidth = activeLine.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = activeLine.tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.stroke();
            const newImage = new window.Image();
            newImage.src = tempCanvas.toDataURL();
            newImage.onload = () => setBakedImage(newImage);
        }

        // Preview line ko saaf karein
        setActiveLine({ points: [] });

        // --- OPTIMISTIC PIXEL COUNT & BATCHING LOGIC ---
        // (Aapka yeh code bhi bilkul theek hai)
        const strokeData = {
            strokePath: [...currentStrokePathRef.current],
            brushSize: brushState.size,
            color: brushState.color,
            mode: brushState.mode,
        };

        const pixelsInThisStroke = currentStrokePathRef.current.length;
        if (pixelsInThisStroke > 0) {
            dispatch(incrementPixelCount({ pixelCountToAdd: pixelsInThisStroke }));
        }

        strokeQueueRef.current.push(strokeData);
        currentStrokePathRef.current = [];

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
    };

    // handleMouseUp ab bohat aasan ho gaya hai
    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        // Yeh sirf 'stopDrawing' ko call karega
        stopDrawing();
    };
   

    const handleMouseDown = (e: any) => {
        const stage = stageRef.current;
        if (!stage) return;

        if (e.evt.button === 2) { // Right-click for panning
            setIsPanning(true);
            panStartPointRef.current = stage.getPointerPosition();
            return;
        }
        startDrawing(e.target.getStage().getRelativePointerPosition());

        if (isReadOnly || !user) {
            if (!user) onGuestInteraction();
            return;
        }
        if (!isContributor) {
            toast.warning("You are not a contributor for this project.");
            return;
        }
        if (brushState.mode === 'move') return;
        if (onClearHighlight) {
            onClearHighlight();
        }
        setIsDrawing(true);
        // const pos = stage.getPointerPosition();
        const pos = getCanvasPointerPosition(stage); // <-- NAYI AUR THEEK LINE
        const { r, g, b, a } = brushState.color;
        const colorString = `rgba(${r}, ${g}, ${b}, ${a})`;

        // Brush/Eraser (Freehand)
        if (brushState.mode === 'brush' || brushState.mode === 'eraser') {
            setIsDrawing(true);
            currentStrokePathRef.current = [];
            // Redux se anay wale color object ko CSS ke rgba string mein convert karein

            setActiveLine({
                points: [pos.x, pos.y],
                tool: brushState.mode,
                stroke: colorString, // <--- AB YEH SAHI DYNAMIC COLOR ISTEMAL KAREGA
                strokeWidth: brushState.size,
            });
        }

        // --- NAYA LOGIC FOR STRAIGHT LINE ---
        if (brushState.mode === 'line') {
            setIsDrawing(true);
            // 1. Line ka start point save karein
            lineStartPointRef.current = pos;
            // 2. activeLine ko shuru karein (start aur end point abhi same hain)
            setActiveLine({
                points: [pos.x, pos.y, pos.x, pos.y],
                tool: 'brush', // Straight line hamesha 'brush' mode mein draw hogi
                stroke: colorString, // <-- USE THE CORRECT DYNAMIC COLOR HERE
                strokeWidth: brushState.size,
            });
        }



    };

    const handleMouseMove = (e: any) => {
        const stage = stageRef.current;
        if (!stage) return;

        if (isPanning) {
            const newPoint = stage.getPointerPosition();
            const newPos = {
                x: stage.x() + (newPoint.x - panStartPointRef.current.x),
                y: stage.y() + (newPoint.y - panStartPointRef.current.y),
            };
            stage.position(newPos);
            panStartPointRef.current = newPoint;
            handleStageChange();
            return;
        }
        draw(e.target.getStage().getRelativePointerPosition());

        onStateChange({ worldPos: stage.getRelativePointerPosition() });

        if (!isDrawing) return;
        const point = stage.getRelativePointerPosition();
        if (!isPointerInsideCanvas(point)) return; // <-- Prevent drawing outside

        if (brushState.mode === 'line') {
            setActiveLine((prev: any) => ({ ...prev, points: [lineStartPointRef.current.x, lineStartPointRef.current.y, point.x, point.y] }));
        } else {
            setActiveLine((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));
            const lastPoints = activeLine.points;
            if (lastPoints.length >= 2) {
                const last = { x: lastPoints[lastPoints.length - 2], y: lastPoints[lastPoints.length - 1] };
                currentStrokePathRef.current.push({ fromX: last.x, fromY: last.y, toX: point.x, toY: point.y });
            }
        }
    };


    

    const handleStageChange = () => {
        if (stageRef.current) {
            onStateChange({
                zoom: stageRef.current.scaleX(),
                position: stageRef.current.position()
            });
        }
    };

    // --- TOUCH EVENT HANDLERS ---
    const handleTouchStart = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const touches = e.evt.touches;

        if (touches.length === 1) {
            // Agar ek ungli hai, to drawing shuru karein
            setIsDrawing(true);
            startDrawing(stage.getRelativePointerPosition());
        } else if (touches.length >= 2) {
            // Agar do ya do se zyada ungliyan hain, to drawing ko foran rokein
            // aur panning ke liye tayar ho jayein
            setIsDrawing(false);

            const touch1 = touches[0];
            const touch2 = touches[1];

            // Dono ungliyon ke darmiyan center point ko yaad karein
            lastPanPointRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
        }
    };
    const handleTouchMove = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const touches = e.evt.touches;

        // --- YEH HAI ASAL NAYI LOGIC ---
        if (touches.length >= 2 && lastPanPointRef.current) {
            // Case A: Agar do ungliyan hain, to PAN karein
            const touch1 = touches[0];
            const touch2 = touches[1];

            const newCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };

            const dx = newCenter.x - lastPanPointRef.current.x;
            const dy = newCenter.y - lastPanPointRef.current.y;

            const newPos = {
                x: stage.x() + dx,
                y: stage.y() + dy,
            };

            stage.position(newPos);
            lastPanPointRef.current = newCenter;
            handleStageChange(); // Parent ko nayi position batayein

        } else if (touches.length === 1 && isDrawing) {
            // Case B: Agar ek ungli hai, to DRAW karein
            onStateChange({ worldPos: stage.getRelativePointerPosition() });
            draw(stage.getRelativePointerPosition());
        }
    };

    const handleTouchEnd = () => {
        lastPanPointRef.current = null;
        if (isDrawing) {
            stopDrawing();
        }
    };

    const highlightedLines = useMemo(() => {
        if (!selectedContributionId) return [];
        const selected = savedStrokes.find((c: any) => c._id === selectedContributionId);
        return selected ? transformContributionForKonva(selected).lines : [];
    }, [selectedContributionId, savedStrokes]);

    return (
        <Stage
            ref={stageRef}
            width={width}
            height={height}
            draggable={false} // We handle drag/pan manually
            style={{
                backgroundColor: '#F0F0F0',
                cursor: isReadOnly ? 'grab' : (isPanning ? 'grabbing' : (brushState.mode === 'move' ? 'grab' : 'crosshair'))
            }}
            onWheel={(e) => {
                e.evt.preventDefault();
                const stage = stageRef.current;
                if (!stage) return;
                const oldScale = stage.scaleX();
                const pointer = stage.getPointerPosition();
                const mousePointTo = {
                    x: (pointer.x - stage.x()) / oldScale,
                    y: (pointer.y - stage.y()) / oldScale,
                };
                let newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
                newScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));
                const newPos = {
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale,
                };
                stage.scale({ x: newScale, y: newScale });
                stage.position(newPos);
                handleStageChange();
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                if (isPanning) setIsPanning(false);
                if (isDrawing) stopDrawing(); // Ab 'stopDrawing' istemal karein
            }}
            onContextMenu={(e) => e.evt.preventDefault()}

            // --- TOUCH EVENTS ---
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}

        >
            <Layer listening={false}>
                <Rect x={0} y={0} width={virtualWidth} height={virtualHeight} fill="white" stroke="#E0E0E0" strokeWidth={4 / (stageRef.current?.scaleX() || 1)} />
                {bakedImage && <KonvaImage image={bakedImage} x={0} y={0} width={virtualWidth} height={virtualHeight} listening={false} />}
                {isDrawing && <Line points={activeLine.points} stroke={activeLine.stroke} strokeWidth={activeLine.strokeWidth} tension={brushState.mode === 'line' ? 0 : 0.5} lineCap="round" lineJoin="round" globalCompositeOperation={activeLine.tool === 'eraser' ? 'destination-out' : 'source-over'} listening={false} />}
            </Layer>
            <Layer listening={false}>
                {highlightedLines.map((line: any, i: any) => <Line key={`highlight-${i}`} {...line} shadowColor="rgba(0, 102, 255, 0.8)" shadowBlur={15} shadowOpacity={0.9} />)}
            </Layer>
        </Stage>
    );
};

export default React.memo(KonvaCanvas);