// src/components/GridLayer.js

import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

const TILE_SIZE = 512;

const GridLayer = ({ width, height, stageState }:any) => {
    // useMemo istemal karein taake grid sirf tab re-calculate ho jab stage ya size badle.
    const gridLines = useMemo(() => {
        const lines = [];
        const { x: stageX, y: stageY, scale } = stageState;

        // Viewport ke world coordinates calculate karein
        const worldLeft = -stageX / scale;
        const worldTop = -stageY / scale;
        const worldRight = worldLeft + width / scale;
        const worldBottom = worldTop + height / scale;

        // Pehli vertical line dhoondein jo viewport mein nazar aa sakti hai
        const firstVerticalLineX = Math.floor(worldLeft / TILE_SIZE) * TILE_SIZE;
        // Pehli horizontal line dhoondein
        const firstHorizontalLineY = Math.floor(worldTop / TILE_SIZE) * TILE_SIZE;

        // Vertical lines banayein
        for (let x = firstVerticalLineX; x < worldRight; x += TILE_SIZE) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, worldTop, x, worldBottom]}
                    stroke="#e0e0e0" // Grid ka halka rang
                    strokeWidth={1 / scale} // Zoom out karne par line moti na ho
                />
            );
        }

        // Horizontal lines banayein
        for (let y = firstHorizontalLineY; y < worldBottom; y += TILE_SIZE) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[worldLeft, y, worldRight, y]}
                    stroke="#e0e0e0"
                    strokeWidth={1 / scale}
                />
            );
        }

        return lines;

    }, [width, height, stageState]);

    return (
        <Layer listening={false}> {/* listening={false} taake grid par click na ho */}
            {gridLines}
        </Layer>
    );
};

export default GridLayer;