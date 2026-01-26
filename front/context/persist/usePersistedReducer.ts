import React, { useEffect, useReducer, Reducer } from "react";

// Define the storage interface
interface Storage {
  get: (key: string, initialValue: any) => any;
  set: (key: string, value: any) => void;
}

function usePersistedReducer<S, A>(
  reducer: Reducer<S, A>,
  initialState: S,
  init: (initialState: S) => S,
  key: string,
  storage: Storage
): [S, React.Dispatch<A>] {
  const [state, dispatch] = useReducer(
    reducer,
    storage.get(key, initialState),
    init
  );

  useEffect(() => {
    storage.set(key, state);
  }, [state, key, storage]);

  return [state, dispatch];
}

export default usePersistedReducer;
