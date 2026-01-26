import createPersistedReducer from "../persist";

export default createPersistedReducer("setting", localStorage);
export const initialState = {
  token: "",
  isLoged: false,
};

export function reducer(state: any, action: any) {
  if (action == null) {
    return { ...initialState };
  } else if ("login" in action) {
    return { ...state, ...action.login, isLoged: true };
  } else {
    return { ...state, ...action };
  }
}
