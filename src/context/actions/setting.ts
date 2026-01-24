import createPersistedReducer from "../persist";

export default createPersistedReducer("setting", localStorage);

export const initialState = {
  token: "",
  isLoged: false,
  userId: null as number | null,
  isNewUser: false,
  theme: "dark",
  lang: "en",
};

export function reducer(state: any, action: any) {
  // Reset all auth state
  if (action === null) {
    return { ...initialState, theme: state?.theme || "dark", lang: state?.lang || "en" };
  }
  
  // Handle login action
  if (action && "login" in action && action.login) {
    const { token, userId, isNewUser } = action.login;
    return {
      ...state,
      token: token || state?.token || "",
      userId: userId ?? state?.userId ?? null,
      isNewUser: isNewUser ?? false,
      isLoged: true,
    };
  }
  
  // Handle general updates (theme, lang, etc.)
  return { ...state, ...action };
}
