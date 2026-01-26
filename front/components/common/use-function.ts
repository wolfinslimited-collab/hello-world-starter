import React from "react";

// Define the type for the callback function
type CallbackFunction = (...args: any[]) => any;

export default function useFunction(
  callback: CallbackFunction
): CallbackFunction {
  // Use a generic type for the ref to match the type of the callback
  const ref = React.useRef<CallbackFunction | undefined>(undefined);

  // Update the current ref to the latest callback
  ref.current = callback;

  // Return a memoized callback function with typed `this` context
  return React.useCallback(function (this: any, ...args: any[]) {
    const callback = ref.current;
    if (typeof callback === "function") {
      // Apply the arguments to the callback
      return callback.apply(this, args);
    }
  }, []);
}
