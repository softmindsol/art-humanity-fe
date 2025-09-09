
import { useState, useEffect } from "react";

export const useMediaQuery = (query: number): boolean => {
  const [matches, setMatches] = useState(window.innerWidth <= query);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${query}px)`);

    const handleChange = () => {
      setMatches(media.matches);
    };

    // Initial check
    handleChange();

    // Listener add karein
    media.addEventListener("change", handleChange);

    // Cleanup listener
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};
