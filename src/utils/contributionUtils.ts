
export const getContributionBoundingBox = (contribution:any) => {
  if (
    !contribution ||
    !contribution.strokes ||
    contribution.strokes.length === 0
  ) {
    return null; // No data to calculate
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  contribution.strokes.forEach((stroke: any) => {
    stroke.strokePath.forEach((segment: any) => {
      minX = Math.min(minX, segment.fromX, segment.toX);
      minY = Math.min(minY, segment.fromY, segment.toY);
      maxX = Math.max(maxX, segment.fromX, segment.toX);
      maxY = Math.max(maxY, segment.fromY, segment.toY);
    });
  });

  if (minX === Infinity) {
    return null; // No valid points found
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
