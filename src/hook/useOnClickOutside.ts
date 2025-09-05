import { useEffect } from "react";

function useOnClickOutside(refs: any, handler: any) {
  useEffect(() => {
    const listener = (event: any) => {
      // Array mein mojood har ref ko check karein
      const isClickInside = refs.some(
        (ref: any) => ref.current && ref.current.contains(event.target)
      );

      // Agar click kisi bhi ref ke andar hua hai, to kuch na karein
      if (isClickInside) {
        return;
      }

      // Agar click sabhi refs ke bahar hua hai, to handler ko call karein
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]); // Effect ab refs (array) par depend karega
}

export default useOnClickOutside;
