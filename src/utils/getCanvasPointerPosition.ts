// -------- YEH NAYA FUNCTION ADD KAREIN (KonvaCanvas.js ke andar) --------

export const getCanvasPointerPosition = (stage:any) => {
  if (!stage) return { x: 0, y: 0 };

  const pointerPosition = stage.getPointerPosition();
  const stageTransform = stage.getAbsoluteTransform().copy();

  // Is transform ka inverse nikaalein
  stageTransform.invert();

  // Screen position par inverse transform apply karein
  const canvasPosition = stageTransform.point(pointerPosition);

  return canvasPosition;
};
