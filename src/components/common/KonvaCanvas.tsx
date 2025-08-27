import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import { useSelector } from 'react-redux';
import {  getContributionsByProject, batchCreateContributions } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData, addMultipleContributionsOptimistically } from '@/redux/slice/contribution';
import useAppDispatch from '@/hook/useDispatch';
import useAuth from '@/hook/useAuth';
import { toast } from 'sonner';
import { transformContributionForKonva } from '@/utils/transformContributionForKonva';



const KonvaCanvas = ({
    projectId, userId, width, height, onStateChange, selectedContributionId, onContributionHover, onContributionLeave, onContributionSelect, onGuestInteraction, isReadOnly, isContributor, socket }: any) => {
    const dispatch = useAppDispatch();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);
    const { user } = useAuth()
    const [isDrawing, setIsDrawing] = useState(false);
    const [_, setContributions] = useState<any>([]);
    const [stageState, setStageState] = useState({ scale: 1, x: 0, y: 0 });
    // Refs
    const currentStrokePathRef = useRef<any>([]); // Backend ke liye
    const lastEmitTimeRef = useRef<any>(0); // Throttling ke liye ref
    // (1) Strokes ko jama karne ke liye ek ref banayein
    const strokeQueueRef = useRef<any>([]);
    const [activeLine, setActiveLine] = useState<any>({ points: [] }); // Smooth drawing ke liye

    // (2) Timer ke liye ek ref banayein
    const batchTimerRef = useRef<any>(null)


    // Data load karne ke liye
    useEffect(() => {
        if (projectId) {
            // Naya thunk call karein
            dispatch(getContributionsByProject({ projectId }));
        }
    }, [projectId, dispatch]);

   
    const sendBatchToServer = useCallback(() => {
        if (strokeQueueRef.current.length > 0) {
            // (FIX 2) Ab queue mein pehle se hi poora data hai,
            // to humein naya object banane ki zaroorat nahi.
            const contributionsToSend = [...strokeQueueRef.current];
            strokeQueueRef.current = []; // Foran queue saaf karein

            console.log(`Sending batch with ${contributionsToSend.length} contributions.`);

            dispatch(batchCreateContributions({ projectId, contributions: contributionsToSend }))
                .unwrap()
                .then((savedContributions) => {
                    savedContributions.forEach((contribution:any) => {
                        if (socket) {
                            socket.emit('new_drawing', { projectId, contribution });
                        }
                    });
                })
                .catch(err => console.error("Batch creation failed:", err));
        }
    }, [dispatch, projectId, socket]);
    useEffect(() => {
        if (savedStrokes && savedStrokes.length > 0) {
            // Data ko process karne ke liye seedha helper function istemal karein
            const loadedContributions = savedStrokes.map(transformContributionForKonva);
            setContributions(loadedContributions);
        } else {
            setContributions([]);
        }
    }, [savedStrokes]);




    const handleWheel = (e: any) => {
        e.evt.preventDefault(); // this event is for preventing the default scroll behavior of the whole page
        const scaleBy = 1.05;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX(); //Yeh zoom karne se pehlay ka mojooda zoom level (e.g., 1.0, 1.2) hasil karta hai.

        // Yeh sab se ahem hissa hai. Yeh calculate karta hai ke aapka mouse screen par jahan hai, woh canvas ke andar (content ke hisab se) asal mein kis coordinate par hai. Isay "pinning the point" kehte hain. Iske bina, zoom hamesha top-left corner se hoga.
        const mousePointTo = {
            x: (stage.getPointerPosition().x - stage.x()) / oldScale,
            y: (stage.getPointerPosition().y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy; // this will help to find either user did zoom in or out

        // Step 1: Naya state object ek variable mein banayein
        const newState = {
            scale: newScale,
            x: stage.getPointerPosition().x - mousePointTo.x * newScale,
            y: stage.getPointerPosition().y - mousePointTo.y * newScale,
        };

        // Step 2: Ab is variable ko dono jagah istemal karein
        setStageState(newState);
        onStateChange({ zoom: newState.scale }); // Ab yeh bilkul sahi kaam karega
    };


    const handleStageMouseMove = (e: any) => {
        // Yeh event drawing ke ilawa bhi chalega
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        // Parent ko mouse position update karein
        onStateChange({ worldPos: pos });

        const now = Date.now();
        // Har 50ms se pehle event na bhejein
        if (socket && now - lastEmitTimeRef.current > 50) {
            lastEmitTimeRef.current = now;
            socket.emit('cursor_move', {
                projectId: projectId,
                user: {
                    name: user?.fullName,
                    color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16), // Ek random color de dein, ya user profile se lein
                },
                position: pos
            });
        }
        // Agar drawing ho rahi hai to drawing logic chalayein
        if (isDrawing) {
            handleDrawingMove(e); // Iska naam change kar diya hai taake confusion na ho
        }
    };



    // --- DRAWING HANDLERS (Updated for Contributions) ---
    const handleMouseDown = (e: any) => {
        if (isReadOnly) {
            return; // Agar read-only hai, to kuch bhi na karo.
        }
        if (!user) {
            // Step 2: Agar nahi, to parent ko khabar dein aur function rok dein
            onGuestInteraction();
            return;
        }

        if (!isContributor) {
            // Agar nahi, to kuch nahi karna. User sirf dekh sakta hai.
            toast.warning("User is not a contributor for this project. Drawing disabled.");
            return;
        }
        if (brushState.mode === 'move' || e.target !== e.target.getStage()) return;

        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        currentStrokePathRef.current = [];

        // Active line ko shuru karein
        setActiveLine({
            points: [pos.x, pos.y],
            tool: brushState.mode,
            stroke: `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a || 1})`,
            strokeWidth: brushState.size,
        });

    };

    const handleDrawingMove = (e: any) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        const currentPoints = activeLine.points;
        setActiveLine((prev:any) => ({ ...prev, points: [...prev.points, point.x, point.y] }));

        // === YAHAN PAR FIX HAI ===
        // Sirf tab path data save karein jab line mein kam se kam 2 points (ek segment) ho
        if (currentPoints.length >= 2) {
            const lastPoint = { x: currentPoints[currentPoints.length - 2], y: currentPoints[currentPoints.length - 1] };
            currentStrokePathRef.current.push({ fromX: lastPoint.x, fromY: lastPoint.y, toX: point.x, toY: point.y });
        }
    }

    const handleMouseUp = () => {
        if (!isDrawing || currentStrokePathRef.current.length === 0) {
            setIsDrawing(false);
            return;
        }
        setIsDrawing(false);

        const tempId = `temp_${Date.now()}_${Math.random()}`;

        // === STEP 1: Object for IMMEDIATE UI UPDATE (Optimistic) ===
        // Ismein `_id` hai taake React isay key ke tor par istemal kar sake.
        const optimisticContribution: any = {
            _id: tempId,
            projectId: projectId,
            userId: { _id: user?.id, fullName: user?.fullName },
            strokes: [{
                strokePath: [...currentStrokePathRef.current],
                brushSize: brushState.size,
                color: brushState.color,
                mode: brushState.mode
            }],
            upvotes: 0, downvotes: 0, createdAt: new Date().toISOString(),
        };

        // Foran UI update karein
        dispatch(addMultipleContributionsOptimistically([optimisticContribution]));

        // === STEP 2: Object for BACKEND ===
        // Ismein `_id` nahi hai. Mongoose isay khud banayega.
        // Lekin ismein `tempId` hai taake Redux baad mein isay pehchan sake.
        const backendContribution = {
            tempId: tempId,
            projectId: projectId,
            userId: userId,
            strokes: optimisticContribution.strokes,
        };

        // Backend wala object queue mein daalein
        strokeQueueRef.current.push(backendContribution);

        // Timer reset karein
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(sendBatchToServer, 3000);

        // Active line aur path ko reset karein
        setActiveLine({ points: [] });
        currentStrokePathRef.current = [];
    };
    
    useEffect(() => {
        return () => {
            sendBatchToServer(); // Send any remaining strokes on cleanup
            if (batchTimerRef.current) {
                clearTimeout(batchTimerRef.current);
            }
        };
    }, [sendBatchToServer]);
    const { scale, ...restStage } = stageState as any;
    return (
        <Stage
            {...restStage}
            width={width} height={height}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleStageMouseMove} // onMouseMove ko Stage par lagayein
            onMouseUp={handleMouseUp}
            scaleX={stageState.scale} scaleY={stageState.scale}
            x={stageState.x} y={stageState.y}
            draggable={brushState.mode === 'move'}
            style={{ cursor: brushState.mode === 'move' ? 'grab' : 'crosshair' }}
        >
            <Layer>
                {savedStrokes?.map((contribution: any) => {
                    const konvaData = transformContributionForKonva(contribution);
                    if (!konvaData.id) return null;
                    const isSelected = contribution.id === selectedContributionId;
                    return (
                        <Group
                            key={konvaData.id}
                            onMouseEnter={(e: any) => {
                                onContributionHover(contribution, e.target.getStage().getPointerPosition());
                                const stage = e.target.getStage() as any;
                                stage.container().style.cursor = 'pointer';
                            }}
                            onMouseLeave={e => {
                                onContributionLeave();

                                const stage = e.target.getStage() as any;
                                stage.container().style.cursor = brushState.mode === 'move' ? 'grab' : 'crosshair';
                            }}
                            onClick={() => {
                                console.log(`Konva Group Clicked. ID: ${konvaData.id}`); // Debugging ke liye

                                onContributionSelect(konvaData.id);
                            }}
                            shadowColor="rgba(0, 102, 255, 0.8)"
                            shadowBlur={isSelected ? 15 : 0}
                            shadowOpacity={isSelected ? 0.9 : 0}
                        >
                            {konvaData.lines.map((line: any, i: any) => <Line key={i} {...line} tension={0.5} lineCap="round" lineJoin="round" perfectDrawEnabled={false} />)}
                        </Group>
                    )
                })}
                {isDrawing && (
                    <Line
                        points={activeLine.points}
                        stroke={activeLine.stroke}
                        strokeWidth={activeLine.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={activeLine.tool === 'eraser' ? 'destination-out' : 'source-over'}
                        perfectDrawEnabled={false}
                    />
                )}
            </Layer>
        </Stage>
    );
};

export default React.memo(KonvaCanvas);