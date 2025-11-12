import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

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
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
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
    const [colorPickerPreview, setColorPickerPreview] = useState<any>(null); // For the preview swatch

    // This is the baked image canvas context, we need access to it
    const bakedImageContextRef = useRef(null);

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
    const memoizedTransform = React.useCallback((c: any) => transformContributionForKonva(c), []);
    const ownershipMapRef = React.useRef<any>(null);
    const wasInsideCanvasRef = useRef(true);

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

    useEffect(() => {
        if (!virtualWidth || !virtualHeight) return;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = virtualWidth;
        offscreenCanvas.height = virtualHeight;
        const ctx = offscreenCanvas.getContext('2d');
        bakedImageContextRef.current = ctx;

        if (!ctx) return;

        const newOwnershipMap = Array(Math.floor(virtualHeight)).fill(null).map(() => Array(Math.floor(virtualWidth)).fill(null));

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, virtualWidth, virtualHeight);

        const contributionsMap = new Map(savedContributions.map((c:any) => [c._id, JSON.parse(JSON.stringify(c))]));

        pendingStrokes.forEach((pending:any) => {
            if (!pending || !pending.contributionId || !Array.isArray(pending.strokes)) return;
            const container = contributionsMap.get(pending.contributionId);
            if (container) container.strokes.push(...pending.strokes);
        });

        const allContributionsToDraw = Array.from(contributionsMap.values());

        allContributionsToDraw.forEach((contribution:any) => {
            if (contribution?.strokes?.length > 0) {
                // Draw visually
                const konvaData = memoizedTransform(contribution);
                konvaData.lines.forEach((line: any) => {
                    // Safety checks for valid line data
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

                // Fill the ownership map
                contribution.strokes.forEach((stroke: any) => {
                    // Har stroke ka apna brushSize hota hai
                    const brushSizeForMap = stroke.brushSize || 1; // Default 1 rakhein agar size na mile

                    stroke.strokePath.forEach((segment: any) => {
                        plotLine(
                            segment.fromX, segment.fromY,
                            segment.toX, segment.toY,
                            newOwnershipMap,
                            contribution._id,
                            virtualWidth,
                            virtualHeight,
                            brushSizeForMap // <-- YEH MISSING PARAMETER ADD KAR DIYA GAYA HAI
                        );
                    });
                });
            }
        });

        ownershipMapRef.current = newOwnershipMap; // Save the map

        const image = new window.Image();
        image.src = offscreenCanvas.toDataURL();
        image.onload = () => setBakedImage(image);
    }, [savedContributions, pendingStrokes, virtualWidth, virtualHeight, memoizedTransform]);

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

        console.log(`Sending a batch of ${strokesToSend.length} strokes to contribution ${activeContributionId}`);

        dispatch(addStrokes({
            contributionId: activeContributionId,
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
                    // Yahan hum pehle owner ka naam nikalenge taake message zyada wazeh ho
                    const ownerContribution = savedContributions.find((c:any) => c._id === pixelOwnerId);
                    const ownerName = ownerContribution?.userId?.fullName || 'another user';

                    toast.error(`This belongs to ${ownerName}. You can only edit your active contribution.`);
                    return; // Drawing ko rok dein
                }

                // Scenario 2: Agar pixel khaali hai, lekin humari active contribution apni nahi hai (sirf doosre ki select ki hui hai)
                // (Yeh check zaroori hai taake user kisi doosre ki contribution ko "extend" na kar sake)
                const activeContribution = savedContributions.find((c:any) => c._id === activeContributionId);
                if (!pixelOwnerId && activeContribution && activeContribution.userId?._id !== user?._id) {
                    toast.error("You can only draw on your own contributions.");
                    return;
                }
            } else {
                return; // Canvas se bahar click hua hai
            }
        }
        if (isReadOnly || !isContributor || brushState.mode === 'move') return;
        if (!user) { onGuestInteraction(); return; }
        if (!isPointerInsideCanvas(pos)) return; // Agar pointer canvas ke bahar hai, drawing stop
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

        const isCurrentlyInside = isPointerInsideCanvas(point);
        const lastPoints = activeLine.points;

        // Ek segment banane ke liye pichla point zaroori hai
        if (lastPoints.length >= 4) { // Kam se kam 2 points (x1, y1, x2, y2) hone chahiye
            const last = { x: lastPoints[lastPoints.length - 4], y: lastPoints[lastPoints.length - 3] };

            // Data segment sirf tab save karein jab mojooda point AND pichla point, dono andar hon.
            // Is se jab user bahar se andar aata hai to ek lambi lakeer nahi banti.
            if (isCurrentlyInside && wasInsideCanvasRef.current) {
                currentStrokePathRef.current.push({ fromX: last.x, fromY: last.y, toX: point.x, toY: point.y });
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
            currentStrokePathRef.current = [{ fromX: startPoint.x, fromY: startPoint.y, toX: endPoint.x, toY: endPoint.y }];
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
            dispatch(incrementPixelCount({ pixelCountToAdd: pixelsInThisStroke }));
        }

        strokeQueueRef.current.push(strokeData);
        currentStrokePathRef.current = [];

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);
    };

    // handleMouseUp ab bohat aasan ho gaya hai
    const handleMouseUp = () => {
        if (brushState.mode === 'picker' && bakedImageContextRef.current) {
            // Get the pixel data from the baked canvas context at the cursor's position
            const pixel = bakedImageContextRef.current.getImageData(pos.x, pos.y, 1, 1).data;
            const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };

            // Update a preview state (optional, for a custom cursor)
            setColorPickerPreview(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);

            // Update the main color wheel in real-time (optional, can be performance intensive)
            // const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            // dispatch(setBrushColor(hsl));
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
            dispatch(addRecentColor({ h: hsl.h, s: hsl.s, l: hsl.l }));
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