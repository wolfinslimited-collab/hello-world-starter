import { useReducer, type Reducer } from "react";

import usePersistedReducer from "./usePersistedReducer";
import createStorage, { type StorageProvider } from "./createStorage";

const createPersistedReducer = <S, A>(
  key: string,
  provider?: StorageProvider
) => {
  if (provider) {
    const storage = createStorage(provider);
    return (
      reducer: Reducer<S, A>,
      initialState: S,
      init?: (initialState: S) => S
    ): [S, React.Dispatch<A>] =>
      usePersistedReducer(reducer, initialState, init!, key, storage);
  }
  return useReducer as typeof useReducer;
};

export default createPersistedReducer;
