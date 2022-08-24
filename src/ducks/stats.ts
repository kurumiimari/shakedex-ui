import {Dispatch} from 'redux';
import {SHAKEDEX_URL} from '../util/shakedex';

export enum ActionTypes {
  TOGGLE_LOADING = 'stats/toggleLoading',
  SET_STATS = 'stats/set'
}

type Action<payload> = {
  type: ActionTypes;
  payload: payload;
  meta?: any;
  error?: boolean;
}

export interface State {
  loading: boolean
  stats: Stats | null
}

export interface Stats {
  totalAuctions: number
  totalCancellations: number
  totalCompletes: number
  auctionCountByDay: {
    date: number
    count: number
  }[]
  monthlyVolume: {
    month: number
    volume: number
  }[]
}

const initialState: State = {
  loading: false,
  stats: null
};

export const toggleLoading = (value: boolean): Action<boolean> => {
  return {
    type: ActionTypes.TOGGLE_LOADING,
    payload: value,
  };
};

export const setStats = (stats: Stats): Action<Stats> => {
  return {
    type: ActionTypes.SET_STATS,
    payload: stats,
  };
};

export const fetchStats = () => async (dispatch: Dispatch) => {
  dispatch(toggleLoading(true));
  try {
    const resp = await fetch(`${SHAKEDEX_URL}/api/v2/stats`, {
      method: 'GET',
    });
    const stats = await resp.json() as Stats;
    dispatch(setStats(stats));
  } finally {
    dispatch(toggleLoading(false));
  }
};

export default function statsReducer (state: State = initialState, action: Action<any>): State {
  switch (action.type) {
    case ActionTypes.SET_STATS:
      return {
        ...state,
        stats: action.payload,
      };
    case ActionTypes.TOGGLE_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}