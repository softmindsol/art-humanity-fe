import { useRef, useState } from "react";

export const useCanvasState = () => {
  // --- REFS ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tilesRef = useRef(new Map());

  // --- STATE ---
  const [canvasState, setCanvasState] = useState({
    zoomLevel: 1,
    offset: { x: 0, y: 0 },
  });
  const [brushState, setBrushState] = useState({
    mode: "brush",
    size: 5,
    color: { r: 0, g: 0, b: 0, a: 1 },
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [toolboxPos, setToolboxPos] = useState({ x: 20, y: 172 });
  const [isDraggingToolbox, setIsDraggingToolbox] = useState(false);
  const [toolboxStart, setToolboxStart] = useState({ x: 0, y: 0 });
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [allStrokes, setAllStrokes] = useState<any[]>([]);
  const [currentStrokePath, setCurrentStrokePath] = useState([]);
  const [totalTiles, setTotalTiles] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [sessionId, setSessionId] = useState("");
  const [canvasId, setCanvasId] = useState("");

  // --- Undo/Redo ---
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  return {
    // Refs
    containerRef,
    viewportCanvasRef,
    tilesRef,

    // Canvas states
    canvasState,
    setCanvasState,
    brushState,
    setBrushState,
    isDrawing,
    setIsDrawing,
    lastPos,
    setLastPos,
    mousePos,
    setMousePos,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    toolboxPos,
    setToolboxPos,
    isDraggingToolbox,
    setIsDraggingToolbox,
    toolboxStart,
    setToolboxStart,
    isCanvasHovered,
    setIsCanvasHovered,
    showGrid,
    setShowGrid,
    hue,
    setHue,
    saturation,
    setSaturation,
    lightness,
    setLightness,
    allStrokes,
    setAllStrokes,
    currentStrokePath,
    setCurrentStrokePath,
    totalTiles,
    setTotalTiles,
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    sessionId,
    setSessionId,
    canvasId,
    setCanvasId,

    // History
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
  };
};
