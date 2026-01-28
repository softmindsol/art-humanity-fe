// --- TYPE DEFINITIONS ---
export interface Position {
    x: number;
    y: number;
}

export interface RgbaColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface StrokeData {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export interface BrushState {
    mode: 'brush' | 'eraser' | 'move';
    size: number;
    color: RgbaColor;
}

export interface CanvasState {
    zoomLevel: number;
    offset: Position;
}

export interface Tile {
    x: number;
    y: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    isDirty: boolean;
}

export interface FetchTilesArgs {
  projectId: string;
  tiles: string; // "0-0,0-1"
}
