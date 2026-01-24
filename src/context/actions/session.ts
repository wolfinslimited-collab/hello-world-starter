import createPersistedReducer from "../persist";

export default createPersistedReducer("session", sessionStorage);

export const initialState = {};

export function reducer(state: any, action: any) {
  if (action == null) {
    return { ...initialState };
  } else {
    return { ...state, ...action };
  }
}
