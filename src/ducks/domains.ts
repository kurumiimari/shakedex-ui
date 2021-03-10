import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import deepEqual from "deep-equal";
import NodeClient from "../util/nodeclient";

export enum ActionTypes {
  SET_DOMAIN = 'domains/setDomain',
}

type Domain = {
  tld: string,
  state: DomainStatus;
  owner: {
    hash: string;
  },
  stats: DomainStats;
  value: number;
  highest: number;
}

export type DomainStatus = 'REVEAL' | 'BIDDING' | 'CLOSED' | 'OPENING' | null;

export type DomainStats = {
  renewalPeriodStart?: number;
  renewalPeriodEnd?: number;
  bidPeriodStart?: number;
  bidPeriodEnd?: number;
  openPeriodStart?: number;
  openPeriodEnd?: number;
  revealPeriodStart?: number;
  revealPeriodEnd?: number;
  available?: number;
};

type State = {
  [tld: string]: Domain;
}

type AppAction<payload> = {
  type: ActionTypes;
  payload: payload;
  meta?: any;
  error?: boolean;
}

const initialState: State = {};

export const fetchDomain = (tld: string) => async (dispatch: Dispatch, getState: () => { app: { apiHost: string; apiKey: string} }) => {
  const { app: { apiHost, apiKey } } = getState();
  const nodeClient = new NodeClient({ apiHost, apiKey });
  const json = await nodeClient.getNameInfo(tld);
  const { result } = json;
  const { start: available } = result?.start;
  const {
    owner,
    stats,
    state,
    value,
    highest,
  } = result.info || {};
  const { hash: ownerHash = '' } = owner || {};
  const {
    renewalPeriodStart,
    renewalPeriodEnd,
    bidPeriodStart,
    bidPeriodEnd,
    openPeriodStart,
    openPeriodEnd,
    revealPeriodStart,
    revealPeriodEnd,
  } = stats || {};

  switch (state) {
    case 'REVEAL':
      dispatch(setDomain(tld, state, ownerHash, revealPeriodStart, revealPeriodEnd, value, highest));
      break;
    case "BIDDING":
      dispatch(setDomain(tld, state, ownerHash, bidPeriodStart, bidPeriodEnd, value, highest));
      break;
    case "OPENING":
      dispatch(setDomain(tld, state, ownerHash, openPeriodStart, openPeriodEnd, value, highest));
      break;
    case "CLOSED":
      dispatch(setDomain(tld, state, ownerHash, renewalPeriodStart, renewalPeriodEnd, value, highest));
      break;
    case null:
      dispatch(setDomain(tld, state, ownerHash, available, -1, value, highest));
      break;
  }

};

export const setDomain = (
  tld: string,
  state: DomainStatus,
  ownerHash: string,
  start: number,
  end: number,
  value: number,
  highest: number,
): AppAction<{
  tld: string;
  state: DomainStatus;
  ownerHash: string;
  start: number;
  end: number;
  value: number;
  highest: number;
}> => {
  return {
    type: ActionTypes.SET_DOMAIN,
    payload: {
      tld,
      state,
      ownerHash,
      start,
      end,
      value,
      highest,
    },
  };
};

export default function domainReducer(state: State = initialState, action: AppAction<any>): State {
  switch (action.type) {
    case ActionTypes.SET_DOMAIN:
      return reduceSetDomain(state, action);
    default:
      return state;
  }
}

function reduceSetDomain(
  state: State,
  action: AppAction<{
    tld: string;
    state: DomainStatus;
    ownerHash: string;
    start: number;
    end: number;
    value: number;
    highest: number;
  }>
): State {
  const {
    tld,
    state: auctionState,
    ownerHash,
    start,
    end,
    value,
    highest,
  } = action.payload;

  state[tld] = makeDomain(tld, auctionState, ownerHash, start, end, value, highest);

  return state;
}

function makeDomain(
  tld = '',
  state: DomainStatus = null,
  ownerHash: string = '',
  start: number = -1,
  end: number = -1,
  value: number = -1,
  highest: number = -1,
): Domain {
  const stats: DomainStats = {};

  switch (state) {
    case "REVEAL":
      stats.revealPeriodStart = start;
      stats.revealPeriodEnd = end;
      break;
    case "BIDDING":
      stats.bidPeriodStart = start;
      stats.bidPeriodEnd = end;
      break;
    case "CLOSED":
      stats.renewalPeriodStart = start;
      stats.renewalPeriodEnd = end;
      break;
    case "OPENING":
      stats.openPeriodStart = start;
      stats.openPeriodEnd = end;
      break;
    case null:
      stats.available = start;
      break;
  }

  return {
    tld,
    state,
    owner: {
      hash: ownerHash,
    },
    stats,
    value,
    highest,
  };
}

export const useDomain = (tld: string): Domain | undefined => {
  return useSelector((state: { domains: State }) => {
    return state.domains[tld];
  }, (a, b) => deepEqual(a, b));
};
