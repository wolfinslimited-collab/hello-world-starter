import React from "react";

type Callback = (...args: any[]) => any;

export default function useCallback(callback: Callback): Callback {
  const ref = React.useRef<Callback | null>(null); // Fix: Provide initial value

  // Update the ref.current value with the latest callback
  React.useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return React.useCallback((...args: any[]) => {
    const cb = ref.current; // Renamed to avoid shadowing
    if (typeof cb === "function") {
      return cb(...args);
    }
  }, []) as Callback; // Fix: Ensure correct return type
}
