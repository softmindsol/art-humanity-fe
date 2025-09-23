import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

// Apne Redux actions aur slices ke ahem imports
import { getContributionsByProject, batchCreateContributions, addStrokes } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData, selectPendingStrokes, selectActiveContributionId } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// Helper function ka import
import { transformContributionForKonva } from '@/utils/transformContributionForKonva';
import { getCanvasPointerPosition } from '@/utils/getCanvasPointerPosition';

// Props ke liye interface (apne project ke hisab se isay ahem banayein)

const KonvaCanvas = ({
    projectId, userId, width, height, onStateChange, selectedContributionId,
    onGuestInteraction, isReadOnly, isContributor, socket, setIsContributionSaving, virtualWidth, virtualHeight,
    onClearHighlight

}: any) => {

    // --- Hooks ---
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);
    const pendingStrokes = useSelector(selectPendingStrokes); // Temporary data
    const activeContributionId = useSelector(selectActiveContributionId); // <-- Get the active ID

    const { user } = useAuth();

    // --- State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [stageState, setStageState] = useState({ scale: 1, x: 0, y: 0 });
    const [activeLine, setActiveLine] = useState<any>({ points: [] });
    const [bakedImage, setBakedImage] = useState<HTMLImageElement | null>(null);
    const lineStartPointRef = useRef<{ x: number; y: number } | null>(null);

    // --- Refs ---
    const currentStrokePathRef = useRef<any[]>([]);
    const strokeQueueRef = useRef<any[]>([]);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDrawingRef = useRef(isDrawing);
    const stageRef = useRef<any>(null);

    // --- zoom in/out limit --- 
    const MAX_ZOOM = 32;
    const MIN_ZOOM = 0.1;


    const memoizedTransformContributionForKonva = useCallback((contribution: any) => {
        return transformContributionForKonva(contribution);
    }, []); // Transform function ko memoize karein

    console.log(virtualWidth, virtualHeight)
    console.log(width, height)
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
    useEffect(() => {
        if (!virtualWidth || !virtualHeight) return;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = virtualWidth;
        offscreenCanvas.height = virtualHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, virtualWidth, virtualHeight);

        const allStrokesToDraw = [...savedStrokes, ...pendingStrokes];

        allStrokesToDraw.forEach((contribution) => {
            if (contribution?.strokes?.length > 0) {
                const konvaData = memoizedTransformContributionForKonva(contribution);
                konvaData.lines.forEach((line: any) => {
                    if (!line.points || line.points.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(line.points[0], line.points[1]);
                    for (let i = 2; i < line.points.length; i += 2) ctx.lineTo(line.points[i], line.points[i + 1]);
                    ctx.strokeStyle = line.stroke;
                    ctx.lineWidth = line.strokeWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalCompositeOperation = line.globalCompositeOperation;
                    ctx.stroke();
                });
            }
        });

        const image = new window.Image();
        image.src = offscreenCanvas.toDataURL();
        image.onload = () => setBakedImage(image);
    }, [savedStrokes, pendingStrokes, virtualWidth, virtualHeight, memoizedTransformContributionForKonva]);


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
        // Yeh effect har baar chalta hai jab "bakedImage" update hoti hai.
        // Iska matlab hai ke canvas ki "baking" mukammal ho chuki hai.

        // Agar hum is waqt drawing nahi kar rahe, to iska matlab hai ke
        // pichli 'activeLine' ab baked image ka hissa ban chuki hai,
        // isliye ab usay screen se hatana safe hai.
        if (!isDrawing) {
            setActiveLine({ points: [] });
        }
    }, [bakedImage, isDrawing]); // bakedImage par depend karna zaroori ha
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
    // Use a `useEffect` to keep the ref in sync with the state.
    // This is a standard React pattern.
    useEffect(() => {
        isDrawingRef.current = isDrawing;
    }, [isDrawing]);
    const sendBatchToServer = useCallback(() => {

        // Check the LATEST value of isDrawing using the ref.
        if (isDrawingRef.current) {
            console.log("User is still drawing, delaying batch send.");
            if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
            batchTimerRef.current = setTimeout(sendBatchToServer, 3000); // Dobara 3 sec ka timer lagayein
            return;
        }
        if (strokeQueueRef.current.length > 0) {

            const contributionsToSend = [...strokeQueueRef.current];
            strokeQueueRef.current = [];
            dispatch(batchCreateContributions({ projectId, contributions: contributionsToSend }))
                .unwrap()
                .then((savedContributions: any[]) => {
                    savedContributions.forEach((contribution: any) => {
                        if (socket) socket.emit('new_drawing', { projectId, contribution });
                    });
                    setIsContributionSaving(false)
                    setActiveLine({ points: [] });
                })
                .catch((err: any) => {
                    toast.error(err || "Could not save your drawing.");
                    setActiveLine({ points: [] });
                    setIsContributionSaving(false)

                });
        }
    }, [dispatch, projectId, socket]);
    // console.log("isDrawing:", isDrawing)

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const scaleBy = 1.05;
        const oldScale = stage.scaleX();

        const mousePointTo = {
            x: (stage.getPointerPosition().x - stage.x()) / oldScale,
            y: (stage.getPointerPosition().y - stage.y()) / oldScale,
        };

        let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        // --- YEH NAYI LOGIC HAI ---
        // Math.max yeh yaqeeni banata hai ke scale MIN_ZOOM se neeche na jaye.
        // Math.min yeh yaqeeni banata hai ke scale MAX_ZOOM se upar na jaye.
        newScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));

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
        if (onClearHighlight) {
            onClearHighlight();
        }
        setIsDrawing(true);
        const stage = e.target.getStage();
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
        const stage = e.target.getStage();
        // onStateChange({ worldPos: stage.getPointerPosition() });
        const worldPos = getCanvasPointerPosition(stage);
        onStateChange({ worldPos });
        if (!isDrawing) return;
        setIsContributionSaving(true)

        // const point = stage.getPointerPosition();
        const point = getCanvasPointerPosition(stage); // <-- NAYI AUR THEEK LINE

        if (brushState.mode === 'brush' || brushState.mode === 'eraser') {
            const lastPoints = activeLine.points;
            setActiveLine((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));

            if (lastPoints.length >= 2) {
                const lastPoint = { x: lastPoints[lastPoints.length - 2], y: lastPoints[lastPoints.length - 1] };
                currentStrokePathRef.current.push({ fromX: lastPoint.x, fromY: lastPoint.y, toX: point.x, toY: point.y });
            }
        }
        // --- NAYA LOGIC FOR STRAIGHT LINE PREVIEW ---
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            const startPoint = lineStartPointRef.current;
            // Line ko update karein: start point se current mouse position tak
            setActiveLine((prev: any) => ({
                ...prev,
                points: [startPoint.x, startPoint.y, point.x, point.y]
            }));
        }
    };


    // const handleMouseUp = () => {
    //     if (!isDrawing) return;

    //     // Step 1: Check if the tool was 'line' and create the final stroke path
    //     if (brushState.mode === 'line' && lineStartPointRef.current) {
    //         const startPoint = lineStartPointRef.current;
    //         const endPoint = { x: activeLine.points[2], y: activeLine.points[3] };

    //         // Create the stroke path data for the backend
    //         currentStrokePathRef.current = [{
    //             fromX: startPoint.x,
    //             fromY: startPoint.y,
    //             toX: endPoint.x,
    //             toY: endPoint.y,
    //         }];
    //         lineStartPointRef.current = null; // Reset the ref
    //     }

    //     // Step 2: Ab check karein ke kya waqai koi drawing save karne ke liye hai
    //     // Yeh check ab freehand aur straight line dono ke liye kaam karega
    //     if (currentStrokePathRef.current.length === 0) {
    //         setIsDrawing(false);
    //         setActiveLine({ points: [] }); // Preview line ko saaf karein (agar hai)
    //         return;
    //     }
    //     // Ab jab humein pata hai ke kuch save karna hai, to hi 'isDrawing' ko false karein
    //     setIsDrawing(false);


    //     // --- NAYA LOGIC FOR INSTANT DRAW ---
    //     // 1. Agar bakedImage mojood hai, to usay ek naye (temporary) canvas par draw karein
    //     const tempCanvas = document.createElement('canvas');
    //     tempCanvas.width = width;
    //     tempCanvas.height = height;
    //     const ctx = tempCanvas.getContext('2d');
    //     if (!ctx) return;

    //     if (bakedImage) {
    //         ctx.drawImage(bakedImage, 0, 0);
    //     } else {
    //         // Agar pehli drawing hai, to safed background banayein
    //         ctx.fillStyle = 'white';
    //         ctx.fillRect(0, 0, width, height);
    //     }

    //     // 2. Ab 'activeLine' ko is temporary canvas par draw karein
    //     ctx.beginPath();
    //     ctx.moveTo(activeLine.points[0], activeLine.points[1]);
    //     for (let i = 2; i < activeLine.points.length; i += 2) {
    //         ctx.lineTo(activeLine.points[i], activeLine.points[i + 1]);
    //     }
    //     ctx.strokeStyle = activeLine.stroke;
    //     ctx.lineWidth = activeLine.strokeWidth;
    //     ctx.lineCap = 'round';
    //     ctx.lineJoin = 'round';
    //     ctx.globalCompositeOperation = activeLine.tool === 'eraser' ? 'destination-out' : 'source-over';
    //     ctx.stroke();

    //     // 3. Is naye canvas se ek nayi image banayein aur usay foran 'bakedImage' set kar dein
    //     const newImage = new window.Image();
    //     newImage.src = tempCanvas.toDataURL();
    //     newImage.onload = () => {
    //         setBakedImage(newImage);
    //     };
    //     // --- INSTANT DRAW MUKAMMAL ---

    //     // 4. activeLine ko foran saaf kar dein
    //     setActiveLine({ points: [] });

    //     // 5. Backend ke liye data tayar karein (yeh logic waisa hi rahega)
    //     const backendContribution = {
    //         projectId: projectId,
    //         userId: userId,
    //         strokes: [{
    //             strokePath: [...currentStrokePathRef.current],
    //             brushSize: brushState.size,
    //             color: brushState.color,
    //             mode: brushState.mode === 'line' ? 'brush' : brushState.mode
    //         }],
    //     };
    //     strokeQueueRef.current.push(backendContribution);
    //     currentStrokePathRef.current = [];

    //     // 6. API call ke liye timer set karein
    //     if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    //     batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
    // };

    const handleMouseUp = () => {
        // If the mouse was released but we weren't in a drawing state, do nothing.
        if (!isDrawing) return;

        // The drawing process is now finished.
        setIsDrawing(false);

        // Step 1: Finalize the stroke path data.
        // For the 'line' tool, we create this data now from the preview line.
        // For the 'brush' tool, this data was already created in handleMouseMove.
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            const startPoint = lineStartPointRef.current;
            const endPoint = { x: activeLine.points[2], y: activeLine.points[3] };

            currentStrokePathRef.current = [{
                fromX: startPoint.x,
                fromY: startPoint.y,
                toX: endPoint.x,
                toY: endPoint.y,
            }];
            lineStartPointRef.current = null; // Reset the ref
        }

        // Step 2: Validate if a stroke was actually made.
        // If the path is empty (e.g., user just clicked without dragging), stop here.
        if (currentStrokePathRef.current.length === 0) {
            setActiveLine({ points: [] }); // Clear any visual artifacts from a simple click
            return;
        }

        // --- NEW "CONTAINER" LOGIC ---
        // Step 3: Check if there is an active contribution "folder" selected.
        if (!activeContributionId) {
            toast.error("Please create or select a contribution first before drawing.");
            setActiveLine({ points: [] }); // Clear the visual line
            currentStrokePathRef.current = []; // Clear the data
            return;
        }

        // Step 4: Prepare the stroke data to be sent to the backend.
        const strokesToSend = [{
            strokePath: [...currentStrokePathRef.current],
            brushSize: brushState.size,
            color: brushState.color,
            mode: brushState.mode, // Send the original mode
        }];

        // --- NEW API CALL ---
        // Step 5: Dispatch the `addStrokes` action immediately. No more batching/queue.
        dispatch(addStrokes({
            contributionId: activeContributionId,
            strokes: strokesToSend
        }))
            .unwrap()
            .then((updatedContribution) => {
                // The backend returns the updated contribution. The socket event will be the main
                // source of truth, but we can log success here.
                console.log("Strokes saved successfully to:", updatedContribution._id);
            })
            .catch((err) => {
                // If the API call fails, inform the user.
                toast.error(`Failed to save drawing: ${err}`);
            });

        // We no longer need the local "instant draw" baking logic, as the UI will now
        // be updated via the real-time socket event, providing a more reliable "source of truth".

        // Step 6: Clean up for the next stroke.
        currentStrokePathRef.current = [];
        setActiveLine({ points: [] });
    };


    const handleDrawEnd = () => {
        if (!isDrawing) return;

        // Step 1: Check if the tool was 'line' and create the final stroke path
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            const startPoint = lineStartPointRef.current;
            const endPoint = { x: activeLine.points[2], y: activeLine.points[3] };

            // Create the stroke path data for the backend
            currentStrokePathRef.current = [{
                fromX: startPoint.x,
                fromY: startPoint.y,
                toX: endPoint.x,
                toY: endPoint.y,
            }];
            lineStartPointRef.current = null; // Reset the ref
        }

        // Step 2: Ab check karein ke kya waqai koi drawing save karne ke liye hai
        // Yeh check ab freehand aur straight line dono ke liye kaam karega
        if (currentStrokePathRef.current.length === 0) {
            setIsDrawing(false);
            setActiveLine({ points: [] }); // Preview line ko saaf karein (agar hai)
            return;
        }
        // Ab jab humein pata hai ke kuch save karna hai, to hi 'isDrawing' ko false karein
        setIsDrawing(false);


        // --- NAYA LOGIC FOR INSTANT DRAW ---
        // 1. Agar bakedImage mojood hai, to usay ek naye (temporary) canvas par draw karein
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        if (bakedImage) {
            ctx.drawImage(bakedImage, 0, 0);
        } else {
            // Agar pehli drawing hai, to safed background banayein
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Ab 'activeLine' ko is temporary canvas par draw karein
        ctx.beginPath();
        ctx.moveTo(activeLine.points[0], activeLine.points[1]);
        for (let i = 2; i < activeLine.points.length; i += 2) {
            ctx.lineTo(activeLine.points[i], activeLine.points[i + 1]);
        }
        ctx.strokeStyle = activeLine.stroke;
        ctx.lineWidth = activeLine.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = activeLine.tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();

        // 3. Is naye canvas se ek nayi image banayein aur usay foran 'bakedImage' set kar dein
        const newImage = new window.Image();
        newImage.src = tempCanvas.toDataURL();
        newImage.onload = () => {
            setBakedImage(newImage);
        };
        // --- INSTANT DRAW MUKAMMAL ---

        // 4. activeLine ko foran saaf kar dein
        setActiveLine({ points: [] });

        // 5. Backend ke liye data tayar karein (yeh logic waisa hi rahega)
        const backendContribution = {
            projectId: projectId,
            userId: userId,
            strokes: [{
                strokePath: [...currentStrokePathRef.current],
                brushSize: brushState.size,
                color: brushState.color,
                mode: brushState.mode === 'line' ? 'brush' : brushState.mode
            }],
        };
        strokeQueueRef.current.push(backendContribution);
        currentStrokePathRef.current = [];

        // 6. API call ke liye timer set karein
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
    };


    const handleDrawStart = (e: any) => {
        if (e.target.getParent().nodeType !== 'Layer') return;
        if (isReadOnly || !user || !isContributor || brushState.mode === 'move') { if (!user) onGuestInteraction(); return; }

        setIsDrawing(true);
        const pos = e.target.getStage().getRelativePointerPosition();
        currentStrokePathRef.current = [];
        const { r, g, b, a } = brushState.color;
        const colorString = `rgba(${r},${g},${b},${a || 1})`;
        const tool = brushState.mode === 'line' ? 'brush' : brushState.mode;

        if (brushState.mode === 'line') {
            lineStartPointRef.current = pos;
            setActiveLine({ points: [pos.x, pos.y, pos.x, pos.y], tool, stroke: colorString, strokeWidth: brushState.size });
        } else {
            setActiveLine({ points: [pos.x, pos.y], tool, stroke: colorString, strokeWidth: brushState.size });
        }
    };

    const handleDrawMove = (e: any) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        onStateChange({ worldPos: stage.getRelativePointerPosition() }); // Update InfoBox

        const point = stage.getRelativePointerPosition();
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            setActiveLine(prev => ({ ...prev, points: [lineStartPointRef.current!.x, lineStartPointRef.current!.y, point.x, point.y] }));
        } else {
            const lastPoints = activeLine.points;
            setActiveLine(prev => ({ ...prev, points: [...prev.points, point.x, point.y] }));
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
    const highlightedLines = useMemo(() => {
        if (!selectedContributionId) return [];
        const selected = savedStrokes.find((c: any) => c._id === selectedContributionId);
        return selected ? transformContributionForKonva(selected).lines : [];
    }, [selectedContributionId, savedStrokes]);

    return (
        <Stage
            width={width}
            height={height}
            scaleX={stageState.scale}
            scaleY={stageState.scale}
            x={stageState.x}
            y={stageState.y}
            // draggable={brushState.mode === 'move'}
            draggable={isReadOnly || brushState.mode === 'move'}

            // style={{ cursor: brushState.mode === 'move' ? 'grab' : 'crosshair' }}
            style={{
                backgroundColor: '#F0F0F0',
                cursor: isReadOnly
                    ? 'grab' // Agar read-only hai, to aam cursor
                    : brushState.mode === 'move'
                        ? 'grab' // Agar move tool hai, to 'grab'
                        : 'crosshair' // Warna drawing wala 'crosshair'
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
        >
            <Layer>
                {bakedImage && <KonvaImage image={bakedImage} listening={false} />}
                {isDrawing && (
                    <Line
                        points={activeLine.points}
                        stroke={activeLine.stroke}
                        strokeWidth={activeLine.strokeWidth}
                        tension={brushState.mode === 'line' ? 0 : 0.5}
                        lineCap="round" lineJoin="round"
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
                    // width={width} height={height}
                    width={virtualWidth}
                    height={virtualHeight}
                    fill="transparent"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp} // Agar user canvas se bahar chala jaye to bhi drawing band kar do'    onTouchStart={handleDrawingStart}
                    // Touch Events
                    onTouchStart={handleDrawStart}
                    onTouchMove={handleDrawMove}
                    onTouchEnd={handleDrawEnd}
                />
            </Layer>
        </Stage>
    );
};

export default React.memo(KonvaCanvas);