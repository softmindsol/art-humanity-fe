// src/hooks/useOnClickOutside.ts
import { useEffect } from "react";

type Event = MouseEvent | TouchEvent;

export const useOnClickOutside = (
  ref: any,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      // Agar element mojood nahi hai ya user ne element ke andar click kiya hai, to kuch na karo
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event); // Warna, handler function (dropdown band karne wala) call karo
    };

    // Event listeners add karein
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    // Cleanup: Component unmount hone par listeners ko hata dein
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]); // Yeh effect sirf tab dobara chalega jab ref ya handler badlega
};
