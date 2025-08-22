export const transformContributionForKonva = (contribution:any) => {
  // Defensive Check 1: Agar poora contribution object hi null hai, to khali lauta do.
  if (!contribution) {
    return { id: null, lines: [] };
  }

  // Defensive Check 2: Agar strokes array mojood nahi ya array nahi hai, to baaqi data lauta do.
  if (!contribution.strokes || !Array.isArray(contribution.strokes)) {
    return { id: contribution._id, userId: contribution.userId, lines: [] };
  }

  const lines = contribution.strokes
    // Defensive Check 3: Sirf un strokes ko process karo jo null nahi hain.
    .filter((stroke: any) => stroke && Array.isArray(stroke.strokePath))
    .map((stroke: any) => {
      // Defensive Check 4: Har stroke ke andar strokePath ko check karo.
      if (!stroke.strokePath || !Array.isArray(stroke.strokePath)) {
        return { points: [] }; // Khali line return karo
      }

      const points = stroke.strokePath.reduce((acc: any, pathSegment: any) => {
        if (!pathSegment) return acc; // Agar segment null hai to skip karo
        if (acc.length === 0) {
          return [
            pathSegment.fromX,
            pathSegment.fromY,
            pathSegment.toX,
            pathSegment.toY,
          ];
        }
        return [...acc, pathSegment.toX, pathSegment.toY];
      }, []);

      return {
        tool: stroke.mode,
        stroke: `rgba(${stroke.color.r}, ${stroke.color.g}, ${
          stroke.color.b
        }, ${stroke.color.a || 1})`,
        strokeWidth: stroke.brushSize,
        points: points,
      };
    });

  return {
    id: contribution._id,
    userId: contribution?.userId,
    lines: lines,
  };
};
