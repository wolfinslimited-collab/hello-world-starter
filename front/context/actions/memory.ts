import createPersistedReducer from "../persist";

export default createPersistedReducer("memory");

export const initialState = {};

export function reducer(state: any, action: any) {
  if (action == null) {
    return { ...initialState };
  } else {
    return { ...state, ...action };
  }
}
