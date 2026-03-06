import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Apne Redux actions aur slices ke ahem imports
import { getContributionsByProject, addStrokes } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData, selectActiveContributionId, selectPendingStrokes, setBrushColor, addRecentColor, setCurrentBrush } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';

// Helper function ka import
import { transformContributionForKonva } from '@/utils/transformContributionForKonva';
import { getCanvasPointerPosition } from '@/utils/getCanvasPointerPosition';
import { incrementPixelCount } from '@/redux/slice/project';
import Konva from 'konva';

// Purane plotLine function ko is naye function se replace karein

const plotLine = (x0: any, y0: any, x1: any, y1: any, map: any, value: any, width: any, height: any, brushSize: any) => {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    // Brush ka radius nikal lein (kam se kam 1 ho)
    const radius = Math.floor(brushSize / 2) || 1;

    while (true) {
        // --- YEH HAI NAYI AUR BEHTAR LOGIC ---
        // Ab ek pixel ke bajaye, poora square (brush ke size ka) fill karein
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const drawX = x0 + i;
                const drawY = y0 + j;

                // Boundary check zaroori hai
                if (drawY >= 0 && drawY < height && drawX >= 0 && drawX < width) {
                    if (map[drawY]) {
                        map[drawY][drawX] = value;
                    }
                }
            }
        }
        // ------------------------------------

        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
};
const hslToRgb = (h: any, s: any, l: any) => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
};
const rgbToHsl = (r: any, g: any, b: any) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};
const KonvaCanvas = ({
    projectId, width, height, onStateChange, selectedContributionId,
    onGuestInteraction, isReadOnly, isContributor, virtualWidth, virtualHeight,
    onClearHighlight, focusTarget, onFocusComplete, onContributionSelect, viewportWidth,
    viewportHeight,

}: any) => {

    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);
    const activeContributionId = useSelector(selectActiveContributionId); // <-- Get the active ID
    const savedContributions = useSelector(selectCanvasData);
    const pendingStrokes = useSelector(selectPendingStrokes);
    const { user } = useAuth();


    // This is the baked image canvas context, we need access to it
    const bakedImageContextRef = useRef<CanvasRenderingContext2D | null>(null);

    // --- State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeLine, setActiveLine] = useState<any>({ points: [] });
    const [bakedImage, setBakedImage] = useState<HTMLImageElement | null>(null);
    const lineStartPointRef = useRef<{ x: number; y: number } | any>(null);
    const [isPanning, setIsPanning] = useState(false);
    
    // Picker Loupe State for Mobile
    const [loupeData, setLoupeData] = useState<{ 
        active: boolean, 
        x: number, 
        y: number, 
        color: string, 
        viewportX: number, 
        viewportY: number 
    } | null>(null);

    // --- Refs ---
    const currentStrokePathRef = useRef<any[]>([]);
    const strokeQueueRef = useRef<any[]>([]);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDrawingRef = useRef(isDrawing);
    const stageRef = useRef<any>(null);
    const panStartPointRef = useRef<any>({ x: 0, y: 0 });
    const lastPanPointRef = useRef<any>(null);
    const memoizedTransform = React.useCallback((c: any) => transformContributionForKonva(c), []);
    const ownershipMapRef = React.useRef<any>(null);
    const wasInsideCanvasRef = useRef(true);
    const lastDistRef = useRef<number>(0); // NEW: Track pinch distance

    // --- zoom in/out limit --- 
    const MAX_ZOOM = 32;
    const MIN_ZOOM = 0.1;


    const memoizedTransformContributionForKonva = useCallback((contribution: any) => {
        return transformContributionForKonva(contribution);
    }, []);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !focusTarget) return;

        console.log("[Focus] Animation starting for target:", focusTarget);

        const { x, y, width, height } = focusTarget;
        const PADDING = 50;


        const scaleX = viewportWidth / (width + PADDING * 2);
        const scaleY = viewportHeight / (height + PADDING * 2);

        const newScale = Math.min(scaleX, scaleY, 2);
        console.log(`Calculated scales: scaleX=${scaleX}, scaleY=${scaleY}, final newScale=${newScale}`);

        const newPos = {
            x: -x * newScale + viewportWidth / 2 - (width / 2) * newScale,
            y: -y * newScale + viewportHeight / 2 - (height / 2) * newScale,
        };

        console.log("[Focus] Setting new position and scale:", newPos, newScale);

        const tween = new Konva.Tween({
            node: stage,
            duration: 0.5,
            scaleX: newScale,
            scaleY: newScale,
            x: newPos.x,
            y: newPos.y,
            easing: Konva.Easings.EaseInOut,
            onFinish: () => {
                console.log("[Focus] Animation finished.");
                onStateChange({ zoom: newScale, position: newPos });
                onFocusComplete();
            }
        });

        tween.play();

    }, [focusTarget, onStateChange, onFocusComplete, viewportWidth, viewportHeight]);



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

    // useEffect(() => {
    //     if (!virtualWidth || !virtualHeight) return;

    //     const offscreenCanvas = document.createElement('canvas');
    //     offscreenCanvas.width = virtualWidth;
    //     offscreenCanvas.height = virtualHeight;
    //     const ctx = offscreenCanvas.getContext('2d');
    //     bakedImageContextRef.current = ctx;

    //     if (!ctx) return;

    //     const newOwnershipMap = Array(Math.floor(virtualHeight)).fill(null).map(() => Array(Math.floor(virtualWidth)).fill(null));

    //     ctx.fillStyle = 'white';
    //     ctx.fillRect(0, 0, virtualWidth, virtualHeight);

    //     const contributionsMap = new Map<string, any>(savedContributions.map((c: any) => [c._id, JSON.parse(JSON.stringify(c))]));

    //     pendingStrokes.forEach((pending: any) => {
    //         if (!pending || !pending.contributionId || !Array.isArray(pending.strokes)) return;
    //         const container = contributionsMap.get(pending.contributionId);
    //         if (container) container.strokes.push(...pending.strokes);
    //     });

    //     const allContributionsToDraw = Array.from(contributionsMap.values());

    //     allContributionsToDraw.forEach((contribution: any) => {
    //         if (contribution && contribution.strokes && Array.isArray(contribution.strokes) && contribution.strokes.length > 0) {
    //             // Draw visually
    //             const konvaData = memoizedTransform(contribution);
    //             konvaData.lines.forEach((line: any) => {
    //                 // Safety checks for valid line data
    //                 if (!line.points || line.points.length < 2) return;

    //                 ctx.beginPath();
    //                 ctx.moveTo(line.points[0], line.points[1]);
    //                 for (let i = 2; i < line.points.length; i += 2) {
    //                     ctx.lineTo(line.points[i], line.points[i + 1]);
    //                 }
    //                 ctx.strokeStyle = line.stroke;
    //                 ctx.lineWidth = line.strokeWidth;
    //                 ctx.lineCap = 'round';
    //                 ctx.lineJoin = 'round';
    //                 ctx.globalCompositeOperation = line.globalCompositeOperation;
    //                 ctx.stroke();
    //             });

    //             // Fill the ownership map
    //             contribution.strokes.forEach((stroke: any) => {
    //                 // Har stroke ka apna brushSize hota hai
    //                 const brushSizeForMap = stroke.brushSize || 1; // Default 1 rakhein agar size na mile

    //                 stroke.strokePath.forEach((segment: any) => {
    //                     plotLine(
    //                         segment.fromX, segment.fromY,
    //                         segment.toX, segment.toY,
    //                         newOwnershipMap,
    //                         contribution._id,
    //                         virtualWidth,
    //                         virtualHeight,
    //                         brushSizeForMap // <-- YEH MISSING PARAMETER ADD KAR DIYA GAYA HAI
    //                     );
    //                 });
    //             });
    //         }
    //     });

    //     ownershipMapRef.current = newOwnershipMap; // Save the map

    //     const image = new window.Image();
    //     image.src = offscreenCanvas.toDataURL();
    //     image.onload = () => setBakedImage(image);
    // }, [savedContributions, pendingStrokes, virtualWidth, virtualHeight, memoizedTransform]);

    useEffect(() => {
        if (!virtualWidth || !virtualHeight) return;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = virtualWidth;
        offscreenCanvas.height = virtualHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, virtualWidth, virtualHeight);

        const contributionsMap = new Map(savedStrokes.map((c: any) =>[c._id, JSON.parse(JSON.stringify(c))]));

        pendingStrokes.forEach((pending: any) => {
            if (!pending || !pending.contributionId || !Array.isArray(pending.strokes)) return;
            const container = contributionsMap.get(pending.contributionId);
            if (container) {
                container.strokes.push(...pending.strokes);
            } else {
                contributionsMap.set(pending._id, { ...pending, userId: user });
            }
        });

        const allContributionsToDraw: any = Array.from(contributionsMap.values());

        // --- YEH HAI ASAL FIX (DRAWING LOGIC) ---
        allContributionsToDraw.forEach((contribution: any) => {
            if (contribution?.strokes?.length > 0) {
                // Hum ab memoizedTransform ka istemal nahi karenge kyunke woh points ko flat kar deta hai.
                // Hum direct backend ke data (strokePath) se draw karenge taake 'gaps' ka pata chal sake.
                
                contribution.strokes.forEach((stroke: any) => {
                    if (!stroke.strokePath || stroke.strokePath.length === 0) return;

                    // Style set karein
                    const c = stroke.color;
                    ctx.strokeStyle = typeof c === 'string' ? c : `rgba(${c.r},${c.g},${c.b},${c.a || 1})`;
                    ctx.lineWidth = stroke.brushSize;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalCompositeOperation = stroke.mode === 'eraser' ? 'destination-out' : 'source-over';

                    ctx.beginPath();

                    // Segment by Segment draw karein aur Gap check karein
                    stroke.strokePath.forEach((segment: any, index: number) => {
                        if (index === 0) {
                            // Pehla point
                            ctx.moveTo(segment.fromX, segment.fromY);
                        } else {
                            // Pishle point ko check karein
                            const prevSegment = stroke.strokePath[index - 1];
                            
                            // AGAR GAP HAI (yani pichla point is naye point se nahi jurta)
                            if (prevSegment.toX !== segment.fromX || prevSegment.toY !== segment.fromY) {
                                // To line ko jorne ke bajaye, pencil utha kar naye point par rakhein
                                ctx.moveTo(segment.fromX, segment.fromY);
                            }
                        }
                        // Line draw karein
                        ctx.lineTo(segment.toX, segment.toY);
                    });
                    
                    ctx.stroke();
                });
            }
        });
        // --- FIX KHATAM ---

        const image = new window.Image();
        image.src = offscreenCanvas.toDataURL();
        image.onload = () => setBakedImage(image);

    },[savedStrokes, pendingStrokes, virtualWidth, virtualHeight, user]); 
  
    const sendBatchToServer = useCallback(() => {

        if (isDrawingRef.current) {
            // Agar user abhi bhi draw kar raha hai, to API call na bhejein
            console.log("User is still drawing, delaying batch send.");

            // Timer ko dobara 3 second ke liye set kar dein
            if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
            batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
            return; // Function ko yahin rok dein
        }

        // Agar queue khaali hai ya koi contribution active nahi hai, to kuch na karein
        if (strokeQueueRef.current.length === 0 || !activeContributionId) {
            return;
        }


        const strokesToSend = [...strokeQueueRef.current];
        strokeQueueRef.current = []; // Queue ko foran khaali kar dein

        console.log(`Sending a batch of ${strokesToSend.length} strokes to contribution ${activeContributionId} for user ${user?._id}`);

        dispatch(addStrokes({
            contributionId: activeContributionId,
            userId: user?._id as string, // User ID pass karein
            strokes: strokesToSend // Poora batch (strokes ka array) bhejein
        }))
            .unwrap()
            .catch((err) => {
                // Agar API call fail ho, to user ko batayein
                toast.error(`Failed to save drawing: ${err}`);
                strokeQueueRef.current.push(...strokesToSend);

            });

    }, [dispatch, activeContributionId]); // Dependency array ko update karein

    const startDrawing = (pos: any) => {
        // --- THIS IS THE CORRECTED VALIDATION ---
        const x = Math.floor(pos.x);
        const y = Math.floor(pos.y);

        if (!activeContributionId) {
            toast.error("You can’t draw on this contribution. Please create your own new contribution.");
            return;
        }

        if (ownershipMapRef.current) {
            if (y >= 0 && y < virtualHeight && x >= 0 && x < virtualWidth) {
                const pixelOwnerId = ownershipMapRef.current[y][x];

                // Scenario 1: Agar is pixel ka malik hai lekin woh active contribution nahi hai
                if (pixelOwnerId && pixelOwnerId !== activeContributionId) {
                    const ownerContribution = savedContributions.find((c: any) => c._id === pixelOwnerId);
                    const ownerName = ownerContribution?.userId?.fullName || 'another user';

                    toast.error(`This belongs to ${ownerName}. You can only edit your active contribution.`);
                    return; // Drawing ko rok dein
                }

                // Scenario 2: Agar pixel khaali hai, lekin humari active contribution apni nahi hai
                const activeContribution = savedContributions.find((c: any) => c._id === activeContributionId);
                if (!pixelOwnerId && activeContribution && activeContribution.userId?._id !== user?._id) {
                    toast.error("You can only draw on your own contributions.");
                    return;
                }
            } else {
                return; // Canvas se bahar click hua hai
            }
        }

        // Special check: If it's a pen, we might want to allow drawing even in move mode?
        // For now, keeping the mode check but clarifying stylus interactions.
        if (isReadOnly || !isContributor || brushState.mode === 'move') return;

        if (!user) { onGuestInteraction(); return; }
        if (!isPointerInsideCanvas(pos)) return;
        wasInsideCanvasRef.current = true;

        if (onClearHighlight) onClearHighlight();

        setIsDrawing(true);
        const { h, s, l } = brushState.color;
        const rgbColor = hslToRgb(h, s, l);
        const colorString = `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b}, 1)`;

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
        if (!isPointerInsideCanvas(point)) {
            return
        }; // Agar pointer canvas ke bahar hai, drawing stop

        const isCurrentlyInside = isPointerInsideCanvas(point);
        const lastPoints = activeLine.points;

        if (brushState.mode === 'line') {
            setActiveLine((prev: any) => ({ ...prev, points: [lineStartPointRef.current.x, lineStartPointRef.current.y, point.x, point.y] }));
        } else {
            setActiveLine((prev: any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));
            
            // Ek segment banane ke liye pichle points zaroori hain
            if (lastPoints.length >= 2) {
                const last = { x: lastPoints[lastPoints.length - 2], y: lastPoints[lastPoints.length - 1] };

                // Data segment sirf tab save karein jab mojooda point AND pichla point, dono andar hon.
                // Is se jab user bahar se andar aata hai to ek lambi lakeer nahi banti.
                if (isCurrentlyInside && wasInsideCanvasRef.current) {
                    currentStrokePathRef.current.push({
                        _id: uuidv4(), // Unique ID for each segment
                        fromX: last.x,
                        fromY: last.y,
                        toX: point.x,
                        toY: point.y
                    });
                }
            }
        }

        // 3. Agle event ke liye state ko update karein
        wasInsideCanvasRef.current = isCurrentlyInside;
    };

    const stopDrawing = () => {
        // Agar drawing ho hi nahi rahi thi, to kuch na karo
        if (!isDrawing) return;
        setIsDrawing(false);

        // Line tool ke liye stroke path ko final karein
        if (brushState.mode === 'line' && lineStartPointRef.current) {
            const startPoint = lineStartPointRef.current;
            const endPoint = activeLine.points.length > 2 ? { x: activeLine.points[2], y: activeLine.points[3] } : startPoint;
            currentStrokePathRef.current = [{ 
                _id: uuidv4(), // Unique ID for line tool segment
                fromX: startPoint.x, 
                fromY: startPoint.y, 
                toX: endPoint.x, 
                toY: endPoint.y 
            }];
            lineStartPointRef.current = null;
        }

        // Agar sirf click hua tha (koi path nahi bana), to ruk jayein
        if (currentStrokePathRef.current.length === 0) {
            setActiveLine({ points: [] });
            return;
        }




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
        const { h, s, l } = brushState.color;
        const rgbColorForBackend = hslToRgb(h, s, l);
        const strokeData = {
            strokePath: [...currentStrokePathRef.current],
            brushSize: brushState.size,
            color: rgbColorForBackend,
            mode: brushState.mode,
        };

        const pixelsInThisStroke = currentStrokePathRef.current.length;
        if (pixelsInThisStroke > 0) {
            // Add to recent colors only if we actually drew something
            dispatch(addRecentColor(brushState.color));
            dispatch(incrementPixelCount({ pixelCountToAdd: pixelsInThisStroke }));
        }

        strokeQueueRef.current.push(strokeData);
        currentStrokePathRef.current = [];

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
    };

    // handleMouseUp ab bohat aasan ho gaya hai
    const handleMouseUp = () => {
        const stage = stageRef.current;
        if (brushState.mode === 'picker' && bakedImageContextRef.current && stage) {
            // Get the pointer position from the stage
            const pos = stage.getPointerPosition();
            if (pos) {
                // We need to account for stage pan and zoom to get the correct pixel on the baked image
                const transform = stage.getAbsoluteTransform().copy();
                transform.invert();
                const localPos = transform.point(pos);

                const x = Math.floor(localPos.x);
                const y = Math.floor(localPos.y);

                // Check bounds
                if (x >= 0 && x < virtualWidth && y >= 0 && y < virtualHeight) {
                    // const ctx = bakedImageContextRef.current as CanvasRenderingContext2D; 
                    // const pixel = ctx.getImageData(x, y, 1, 1).data;
                    // const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
                    // Update a preview state (optional, for a custom cursor)
                    // setColorPickerPreview(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
                }
            }
        }
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        stopDrawing();
    };


    // const handleMouseDown = (e: any) => {
    //     const stage = stageRef.current;
    //     if (!stage) return;

    //     if (e.evt.button === 2) { // Right-click for panning
    //         setIsPanning(true);
    //         panStartPointRef.current = stage.getPointerPosition();
    //         return;
    //     }
    //     startDrawing(e.target.getStage().getRelativePointerPosition());

    //     if (isReadOnly || !user) {
    //         if (!user) onGuestInteraction();
    //         return;
    //     }
    //     if (!isContributor) {
    //         toast.warning("You are not a contributor for this project.");
    //         return;
    //     }
    //     if (brushState.mode === 'move') return;
    //     if (onClearHighlight) {
    //         onClearHighlight();
    //     }
    //     setIsDrawing(true);

    //     if (brushState.mode === 'picker' && bakedImageContextRef.current) {
    //         const pixel = bakedImageContextRef.current.getImageData(pos.x, pos.y, 1, 1).data;
    //         const rgb = { r: pixel[0], g: pixel[1], b: pixel[2], a: 1 };

    //         // Convert the picked RGB color back to HSL for our Redux state
    //         const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    //         // Dispatch to set the brush color
    //         dispatch(setBrushColor({ h: hsl.h, s: hsl.s, l: hsl.l }));

    //         // Add the picked color to recent colors
    //         dispatch(addRecentColor({ h: hsl.h, s: hsl.s, l: hsl.l }));

    //         // Switch the tool back to the brush
    //         dispatch(setCurrentBrush({ mode: 'brush' }));

    //         toast.success("Color picked!");
    //         return; // Stop further execution
    //     }
    //     const pos = getCanvasPointerPosition(stage);

    //     const { h, s, l } = brushState.color;
    //     const rgbColor = hslToRgb(h, s, l);
    //     const colorString = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 1)`;
    //     let clickedOnContributionId = null;
    //     if (ownershipMapRef.current) {
    //         const x = Math.floor(pos.x);
    //         const y = Math.floor(pos.y);
    //         if (y >= 0 && y < virtualHeight && x >= 0 && x < virtualWidth) {
    //             clickedOnContributionId = ownershipMapRef.current[y][x];
    //         }
    //     }
    //     // Step 2: Faisla karein
    //     if (clickedOnContributionId) {
    //         // Agar click drawing par hua hai, to parent ko ID bhejein
    //         onContributionSelect(clickedOnContributionId);
    //     } else {
    //         // Agar click khaali jagah par hua hai, to highlight saaf karne ka event bhejein
    //         onClearHighlight();
    //     }
    //     if (brushState.mode === 'brush' || brushState.mode === 'eraser') {
    //         setIsDrawing(true);
    //         currentStrokePathRef.current = [];
    //         // Redux se anay wale color object ko CSS ke rgba string mein convert karein

    //         setActiveLine({
    //             points: [pos.x, pos.y],
    //             tool: brushState.mode,
    //             stroke: colorString,
    //             strokeWidth: brushState.size,
    //         });
    //     }

    //     if (brushState.mode === 'line') {
    //         setIsDrawing(true);
    //         lineStartPointRef.current = pos;
    //         setActiveLine({
    //             points: [pos.x, pos.y, pos.x, pos.y],
    //             tool: 'brush',
    //             stroke: colorString,
    //             strokeWidth: brushState.size,
    //         });
    //     }
    //     startDrawing(pos);



    // };


    const handleMouseDown = (e: any) => {
        const stage = stageRef.current;
        if (!stage) return;

        // Step 1: Right-click ko handle karein (panning ke liye)
        if (e.evt.button === 2) {
            setIsPanning(true);
            panStartPointRef.current = stage.getPointerPosition();
            return;
        }

        // --- Prevent Drawing if Zoom < 1 ---
        if (stage.scaleX() < 1) {
            toast.error("Please zoom in to at least 100% to draw.");
            return;
        }
        // -----------------------------------

        if (isReadOnly || !user) {
            if (!user) onGuestInteraction();
            return;
        }
        if (!isContributor) {
            toast.warning("You are not a contributor for this project.");
            return;
        }
        // Sirf left-click hi aage jayega
        if (e.evt.button !== 0) return;

        // Step 2: Canvas par click ki position nikalein
        const pos = getCanvasPointerPosition(stage);

        // Step 3: Agar Color Picker mode on hai, to usay handle karein
        if (brushState.mode === 'picker' && bakedImageContextRef.current) {
            const pixel = (bakedImageContextRef.current as any).getImageData(pos.x, pos.y, 1, 1).data;
            const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

            dispatch(setBrushColor({ h: hsl.h, s: hsl.s, l: hsl.l }));
            // dispatch(addRecentColor({ h: hsl.h, s: hsl.s, l: hsl.l })); // REMOVED: Now only added on draw
            dispatch(setCurrentBrush({ mode: 'brush' }));

            toast.success("Color picked!");
            return; // Picker ke baad drawing shuru nahi karni, isliye yahin se return karein
        }

        // Step 4: Pata lagayein ke user ne kisi drawing par click kiya hai ya nahi
        let clickedOnContributionId = null;
        if (ownershipMapRef.current) {
            const x = Math.floor(pos.x);
            const y = Math.floor(pos.y);
            if (y >= 0 && y < virtualHeight && x >= 0 && x < virtualWidth) {
                clickedOnContributionId = ownershipMapRef.current[y][x];
            }
        }

        // Step 5: Click ke hisab se Active ID set karein
        if (clickedOnContributionId) {
            if (clickedOnContributionId !== activeContributionId) {
                onContributionSelect(clickedOnContributionId);
            }
        } else {
            onClearHighlight();
        }

        // Step 6: Ab jab sab kuch set ho chuka hai, to drawing shuru karein
        // Is function ko sirf ek baar, bilkul aakhir mein call karein
        startDrawing(pos);
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
    // --- TOUCH EVENT HANDLERS ---
    const getDistance = (p1: any, p2: any) => {
        return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
    };

    const handleTouchStart = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const touches = e.evt.touches;
        const activeTouches = Array.from(touches);

        // Apple Pencil / Stylus detection for palm rejection
        const stylusTouch: any = activeTouches.find((t: any) => t.touchType === 'stylus');

        // Coordinate transformation function for specific touches
        const getTouchPosOnStage = (touch: any) => {
            const transform = stage.getAbsoluteTransform().copy().invert();
            return transform.point({ x: touch.clientX, y: touch.clientY });
        };

        if (stylusTouch) {
            // Priority 1: If an Apple Pencil is detected, prioritize it for drawing
            if (stage.scaleX() < 1) {
                toast.error("Please zoom in to at least 100% to draw.");
                return;
            }

            const pos = getTouchPosOnStage(stylusTouch);

            // Handle Picker tool for Stylus
            if (brushState.mode === 'picker' && bakedImageContextRef.current) {
                const pixel = (bakedImageContextRef.current as any).getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
                const pickedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                
                setLoupeData({
                    active: true,
                    x: pos.x,
                    y: pos.y,
                    color: pickedColor,
                    viewportX: stylusTouch.clientX,
                    viewportY: stylusTouch.clientY
                });
                return;
            }

            setIsDrawing(true);
            startDrawing(pos);
            return;
        }

        if (touches.length === 1) {
            if (stage.scaleX() < 1) {
                toast.error("Please zoom in to at least 100% to draw.");
                return;
            }

            const pos = stage.getRelativePointerPosition();

            // Handle Picker tool for Touch
            if (brushState.mode === 'picker' && bakedImageContextRef.current) {
                const pos = stage.getRelativePointerPosition();
                const pixel = (bakedImageContextRef.current as any).getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
                const pickedColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                
                setLoupeData({
                    active: true,
                    x: pos.x,
                    y: pos.y,
                    color: pickedColor,
                    viewportX: touches[0].clientX,
                    viewportY: touches[0].clientY
                });
                return;
            }

            setIsDrawing(true);
            startDrawing(pos);
        } else if (touches.length >= 2) {
            // If already drawing with a primary touch, don't start panning
            if (isDrawing) return;

            e.evt.preventDefault();
            setIsDrawing(false);

            const touch1 = touches[0];
            const touch2 = touches[1];

            lastPanPointRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };

            lastDistRef.current = getDistance(touch1, touch2);
        }
    };

    const handleTouchMove = (e: any) => {
        const stage = e.target.getStage();
        if (!stage) return;

        e.evt.preventDefault();
        const touches = e.evt.touches;
        const activeTouches = Array.from(touches);
        const stylusTouch: any = activeTouches.find((t: any) => t.touchType === 'stylus');

        const getTouchPosOnStage = (touch: any) => {
            const transform = stage.getAbsoluteTransform().copy().invert();
            return transform.point({ x: touch.clientX, y: touch.clientY });
        };

        // Case 1: Picker Mode Loupe handling
        if (brushState.mode === 'picker' && loupeData?.active && bakedImageContextRef.current) {
            const touch = stylusTouch || touches[0];
            const pos = getTouchPosOnStage(touch);
            
            const pixel = (bakedImageContextRef.current as any).getImageData(
                Math.floor(Math.max(0, Math.min(virtualWidth - 1, pos.x))),
                Math.floor(Math.max(0, Math.min(virtualHeight - 1, pos.y))),
                1, 1).data;
            
            setLoupeData({
                active: true,
                x: pos.x,
                y: pos.y,
                color: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`,
                viewportX: touch.clientX,
                viewportY: touch.clientY
            });
            return;
        }

        // Palm Rejection: If drawing with stylus, ignore other touches for pan/zoom
        if (stylusTouch && isDrawing) {
            const pos = getTouchPosOnStage(stylusTouch);
            onStateChange({ worldPos: pos });
            draw(pos);
            return;
        }

        if (touches.length >= 2 && lastPanPointRef.current && !isDrawing) {
            const touch1 = touches[0];
            const touch2 = touches[1];

            const dist = getDistance(touch1, touch2);
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

            if (lastDistRef.current > 0) {
                const oldScale = stage.scaleX();
                const scaleBy = dist / lastDistRef.current;
                const newScale = oldScale * scaleBy;
                const constrainedScale = Math.max(MIN_ZOOM, Math.min(newScale, MAX_ZOOM));

                const mousePointTo = {
                    x: (newCenter.x - stage.x()) / oldScale,
                    y: (newCenter.y - stage.y()) / oldScale,
                };

                const newPosZoom = {
                    x: newCenter.x - mousePointTo.x * constrainedScale,
                    y: newCenter.y - mousePointTo.y * constrainedScale,
                };

                stage.scale({ x: constrainedScale, y: constrainedScale });
                stage.position(newPosZoom);
            }

            lastDistRef.current = dist;
            handleStageChange();

        } else if (touches.length === 1 && isDrawing) {
            onStateChange({ worldPos: stage.getRelativePointerPosition() });
            draw(stage.getRelativePointerPosition());
        }
    };


    const handleTouchEnd = () => {
        // Handle Picker completion
        if (brushState.mode === 'picker' && loupeData?.active) {
            const rgbMatch = loupeData.color.match(/\d+/g);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[0]), g = parseInt(rgbMatch[1]), b = parseInt(rgbMatch[2]);
                const hsl = rgbToHsl(r, g, b);
                dispatch(setBrushColor(hsl));
                dispatch(setCurrentBrush({ mode: 'brush' }));
                dispatch(addRecentColor(hsl));
                toast.success("Color picked!");
            }
            setLoupeData(null);
            return;
        }

        lastPanPointRef.current = null;
        if (isDrawing) {
            stopDrawing();
        }
        lastDistRef.current = 0;
    };

    const highlightedBox = useMemo(() => {
        if (!selectedContributionId) return null;
        const selected = savedStrokes.find((c: any) => c._id === selectedContributionId);
        if (!selected) return null;

        // Use the existing utility logic to find bounds (or reimplement briefly here if imports are tricky, but best to reuse logic if possible. 
        // Since getContributionBoundingBox is in utils, we could import it, but let's just do a quick calculation here as it is robust enough for a highlight box)
        // Actually, let's keep it simple and consistent.

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasPoints = false;

        selected.strokes.forEach((stroke: any) => {
            stroke.strokePath.forEach((segment: any) => {
                minX = Math.min(minX, segment.fromX, segment.toX);
                minY = Math.min(minY, segment.fromY, segment.toY);
                maxX = Math.max(maxX, segment.fromX, segment.toX);
                maxY = Math.max(maxY, segment.fromY, segment.toY);
                hasPoints = true;
            });
        });

        if (!hasPoints) return null;

        // Add some padding
        const padding = 10;
        return {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + (padding * 2),
            height: (maxY - minY) + (padding * 2)
        };
    }, [selectedContributionId, savedStrokes]);

    return (
        <>
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
                {highlightedBox && (
                    <Rect
                        x={highlightedBox.x}
                        y={highlightedBox.y}
                        width={highlightedBox.width}
                        height={highlightedBox.height}
                        stroke="#0066FF"
                        strokeWidth={2 / (stageRef.current?.scaleX() || 1)} // Dynamic stroke width
                        fillEnabled={false}
                        dash={[10, 5]}
                        shadowColor="rgba(0, 102, 255, 0.4)"
                        shadowBlur={10}
                    />
                )}
            </Layer>
        </Stage>

        {/* Picker Loupe Overlay */}
        {loupeData?.active && (
            <div 
                style={{
                    position: 'fixed',
                    left: loupeData.viewportX,
                    top: loupeData.viewportY - 80, // Position above the finger
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-50%, -100%)',
                    borderRadius: '50%',
                    border: '4px solid white',
                    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                    backgroundColor: loupeData.color,
                    zIndex: 9999,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}
            >
                {/* Magnified Content */}
                {bakedImage && (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${bakedImage.src})`,
                            backgroundSize: `${virtualWidth * 6}px ${virtualHeight * 6}px`, // 6x Zoom
                            backgroundPosition: `calc(50% - ${(loupeData.x - virtualWidth/2) * 6}px) calc(50% - ${(loupeData.y - virtualHeight/2) * 6}px)`,
                            backgroundRepeat: 'no-repeat',
                            borderRadius: '50%'
                        }}
                    />
                )}
                {/* Crosshair / Center Point */}
                <div style={{
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    border: '1px solid white',
                    boxShadow: '0 0 2px black',
                    backgroundColor: 'transparent',
                    zIndex: 2
                }} />
                
                {/* Color Label Bottom */}
                <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    fontSize: '10px',
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}>
                    PICKER
                </div>
            </div>
        )}
        </>
    );
};

export default React.memo(KonvaCanvas);