import {shallowEqual, useSelector} from "react-redux";
import deepEqual from "deep-equal";

export enum ActionTypes {
  INIT_APP = 'app/initApp',
  UPDATE_API = 'app/updateAPI',
  SET_DEV_MODE = 'app/setDevMode',
}

export type State = {
  apiHost: string;
  apiKey: string;
  devMode: boolean;
}

type Action<payload> = {
  type: ActionTypes;
  payload?: payload;
  meta?: any;
  error?: boolean;
}

const initialState: State = {
  apiHost: 'https://api.handshakeapi.com/hsd',
  apiKey: '',
  devMode: false,
};

export const initApp = (): Action<undefined> => ({
  type: ActionTypes.INIT_APP,
});

export const updateAPI = (apiHost: string, apiKey = ''): Action<{apiHost: string; apiKey?: string}> => ({
  type: ActionTypes.UPDATE_API,
  payload: { apiHost, apiKey },
});

export const setDevMode = (devMode: boolean): Action<boolean> => ({
  type: ActionTypes.SET_DEV_MODE,
  payload: devMode,
});

export default function appReducer(state: State = initialState, action: Action<any>): State {
  switch (action.type) {
    case ActionTypes.UPDATE_API:
      return {
        ...state,
        apiHost: action.payload.apiHost,
        apiKey: action.payload.apiKey,
      };
    case ActionTypes.SET_DEV_MODE:
      return {
        ...state,
        devMode: action.payload,
      };
    default:
      return state;
  }
}

export const useAPI = () => {
  return useSelector((state: { app: State}) => {
    return {
      apiHost: state.app.apiHost,
      apiKey: state.app.apiKey,
    };
  }, (a, b) => deepEqual(a, b));
};

export const useDevMode = () => {
  return useSelector((state: { app: State }) => {
    return state.app.devMode;
  }, (a, b) => deepEqual(a, b));
};
