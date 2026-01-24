import createPersistedReducer from "../persist";
export default createPersistedReducer("app");

export const initialState = {
  mine: 0,
};
export function reducer(state: any, action: any) {
  if (action == null) {
    return { ...initialState };
  } else {
    return { ...state, ...action };
  }
}
