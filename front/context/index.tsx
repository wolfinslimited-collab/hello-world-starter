import React, { useContext, type ReactNode } from "react";
import storeContext, { type StoreContextType } from "./context"; // Import StoreContextType
import settingReducer, {
  reducer as _setSetting,
  initialState as _setting,
} from "./actions/setting";
import appReducer, {
  reducer as _setApp,
  initialState as _app,
} from "./actions/app";
import sessionReducer, {
  reducer as _setSession,
  initialState as _session,
} from "./actions/session";
import memoryReducer, {
  reducer as _setMemory,
  initialState as _memory,
} from "./actions/memory";

// Define props for the provider
interface StoreContextProviderProps {
  children: ReactNode;
}

// Create the context provider
export const StoreContextProvider: React.FC<StoreContextProviderProps> = ({
  children,
}) => {
  const [setting, setSetting] = settingReducer(_setSetting, _setting);
  const [app, setApp] = appReducer(_setApp, _app);
  const [session, setSession] = sessionReducer(_setSession, _session);
  const [memory, setMemory] = memoryReducer(_setMemory, _memory);

  // Construct the context value
  const contextValue: StoreContextType = {
    setting,
    setSetting,
    app,
    setApp,
    session,
    setSession,
    memory,
    setMemory,
  };

  return (
    <storeContext.Provider value={contextValue}>
      {children}
    </storeContext.Provider>
  );
};

// Export hook to use the context
export default function useStorage() {
  const context = useContext(storeContext);
  if (!context) {
    throw new Error("useStorage must be used within a StoreContextProvider");
  }
  return context;
}
