import { useEffect, useState, RefObject } from "react";
import ResizeObserver from "resize-observer-polyfill"; // A fallback for older browsers

interface Dimensions {
  width: number;
  height: number;
}

export function useResizeObserver(ref: RefObject<HTMLElement>): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // We only have one element to observe
      if (!entries || entries.length === 0) return;

      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(element);

    // Cleanup function
    return () => {
      resizeObserver.unobserve(element);
    };
  }, [ref]); // Re-run if the ref itself changes

  return dimensions;
}
