// src/utils/transformContributionForKonva.js

export const transformContributionForKonva = (contribution:any) => {
  if (!contribution || !Array.isArray(contribution.strokes)) {
    return { id: contribution?._id, lines: [] };
  }

  const lines = contribution.strokes
    .filter(
      (stroke: any) =>
        stroke &&
        Array.isArray(stroke.strokePath) &&
        stroke.strokePath.length > 0
    )
    .map((stroke: any) => {
      // This is a simpler and more reliable way to create the points array
      const points = stroke.strokePath.flatMap((segment: any) => {
        if (
          segment &&
          typeof segment.fromX === "number" &&
          typeof segment.toX === "number"
        ) {
          return [segment.fromX, segment.fromY, segment.toX, segment.toY];
        }
        return []; // Skip malformed segments
      });

      // CRITICAL DEBUGGING: Check if points are being generated
      if (points.length === 0) {
        console.warn(
          "Skipping a stroke because it has no valid points:",
          stroke
        );
      }

      return {
        points: points,
        stroke: `rgba(${stroke.color.r}, ${stroke.color.g}, ${
          stroke.color.b
        }, ${stroke.color.a || 1})`,
        strokeWidth: stroke.brushSize,
        globalCompositeOperation:
          stroke.mode === "eraser" ? "destination-out" : "source-over",
      };
    });

  return {
    id: contribution._id,
    lines: lines,
  };
};
