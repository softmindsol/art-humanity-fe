// src/components/KonvaCanvas.js

import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { createContribution, getContributionsByProject } from '@/redux/action/contribution';
import { selectCurrentBrush, selectCanvasData } from '@/redux/slice/contribution';
import { v4 as uuidv4 } from 'uuid'; // Unique IDs banane ke liye (npm install uuid @types/uuid)



const KonvaCanvas = ({ projectId, userId, width, height, onStateChange, selectedContributionId, onContributionHover, onContributionLeave, onContributionSelect }: any) => {
    const dispatch = useDispatch<AppDispatch>();
    const brushState = useSelector(selectCurrentBrush);
    const savedStrokes = useSelector(selectCanvasData);

    const [isDrawing, setIsDrawing] = useState(false);
    const [contributions, setContributions] = useState<any>([]);
    const [stageState, setStageState] = useState({ scale: 1, x: 0, y: 0 });
    // Refs
    const currentStrokePathRef = useRef<any>([]); // Backend ke liye
    const activeContributionIdRef = useRef(null); // Mojooda drawing session ko track karne ke liye



    // Data load karne ke liye
    useEffect(() => {
        if (projectId) {
            // Naya thunk call karein
            dispatch(getContributionsByProject({ projectId }));
        }
    }, [projectId, dispatch]);


    useEffect(() => {
        if (savedStrokes && savedStrokes.length > 0) {
            const loadedContributions = savedStrokes.map((contribution: any) => {

                // Step 1: Har contribution ke andar uske 'strokes' array par map karein
                const lines = contribution.strokes.map((stroke: any) => {

                    // Step 2: Har stroke ke 'strokePath' ko Konva ke 'points' format mein badlein
                    const points = stroke.strokePath.reduce((acc: any, pathSegment: any) => {
                        if (acc.length === 0) {
                            return [pathSegment.fromX, pathSegment.fromY, pathSegment.toX, pathSegment.toY];
                        }
                        return [...acc, pathSegment.toX, pathSegment.toY];
                    }, []);

                    // Step 3: Frontend ke liye 'line' object banayein
                    // Ab `stroke.color`, `stroke.brushSize` bilkul sahi kaam karega
                    return {
                        tool: stroke.mode,
                        stroke: `rgba(${stroke.color.r}, ${stroke.color.g}, ${stroke.color.b}, ${stroke.color.a || 1})`,
                        strokeWidth: stroke.brushSize,
                        points: points,
                    };
                });

                // Step 4: Frontend ke liye 'contribution' object banayein
                return {
                    id: contribution._id, // MongoDB se _id istemal karein
                    userId: contribution?.userId,
                    artist: {
                        id: contribution.userId?._id,
                        name: contribution.userId?.fullName || 'Unknown',
                    },
                    lines: lines, // Yahan poora lines ka array aayega
                };
            });
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

        // Agar drawing ho rahi hai to drawing logic chalayein
        if (isDrawing) {
            handleDrawingMove(e); // Iska naam change kar diya hai taake confusion na ho
        }
    };



    // --- DRAWING HANDLERS (Updated for Contributions) ---
    const handleMouseDown = (e: any) => {
        if (brushState.mode === 'move' || e.target !== e.target.getStage()) return;

        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        currentStrokePathRef.current = [];

        // Step 1: Ek naya contribution banayein
        const newContributionId = uuidv4();
        activeContributionIdRef.current = newContributionId as any;

        const newContribution = {
            id: newContributionId,
            userId: userId, // Mojooda user ki ID
            lines: [
                { // Is contribution ki pehli line
                    tool: brushState.mode,
                    stroke: `rgba(${brushState.color.r}, ${brushState.color.g}, ${brushState.color.b}, ${brushState.color.a || 1})`,
                    strokeWidth: brushState.size,
                    points: [pos.x, pos.y],
                }
            ]
        };

        // Step 2: Naye contribution ko state mein add karein
        setContributions((prev: any) => [...prev, newContribution]);
    };

    const handleDrawingMove = (e: any) => {
        if (!isDrawing) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        // Step 1: Active contribution ko dhoondein
        const activeContrib = contributions.find((c: any) => c.id === activeContributionIdRef.current);
        if (!activeContrib) return;

        // Step 2: Uski aakhri line ko update karein
        let lastLine = activeContrib.lines[activeContrib.lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // Step 3: State ko immutably update karein
        setContributions((prev: any) => [...prev]); // Simple way to force re-render

        // Backend ke liye path data banayein (yeh waisa hi rahega)
        const lastPoint = { x: lastLine.points[lastLine.points.length - 4], y: lastLine.points[lastLine.points.length - 3] };
        currentStrokePathRef.current.push({ fromX: lastPoint.x, fromY: lastPoint.y, toX: point.x, toY: point.y });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        activeContributionIdRef.current = null; // Active session khatm karein
        if (currentStrokePathRef.current.length === 0) return;

        const contributionPayload = {
            projectId: projectId,
            strokes: [
                {
                    strokePath: currentStrokePathRef.current,
                    brushSize: brushState.size,
                    color: brushState.color,
                    mode: brushState.mode
                }
            ],
            userId
        };

        // Naya thunk call karein
        dispatch(createContribution(contributionPayload));
        dispatch(getContributionsByProject({ projectId, sortBy: "newest" })).unwrap(); // Contributions ko update karne ke liye

        currentStrokePathRef.current = [];
    };

    return (
        <Stage
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
                {contributions.map((contribution: any) => {
                    const isSelected = contribution.id === selectedContributionId;
                    return (
                        <Group
                            key={contribution.id}
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
                                onContributionSelect(contribution.id);
                            }}
                            shadowColor="rgba(0, 102, 255, 0.8)"
                            shadowBlur={isSelected ? 15 : 0}
                            shadowOpacity={isSelected ? 0.9 : 0}
                        >
                            {contribution.lines.map((line: any, i: any) => (
                                <Line
                                    key={i}
                                    points={line.points}
                                    stroke={line.stroke}
                                    strokeWidth={line.strokeWidth}
                                    tension={0.5}
                                    lineCap="round"
                                    lineJoin="round"
                                    globalCompositeOperation={
                                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                                    }
                                />
                            ))}
                        </Group>
                    )
                })}
            </Layer>
        </Stage>
    );
};

export default KonvaCanvas;