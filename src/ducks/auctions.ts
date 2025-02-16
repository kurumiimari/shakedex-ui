import {Dispatch} from 'redux';
import deepEqual from 'deep-equal';
import {useSelector} from 'react-redux';
import NodeClient from '../util/nodeclient';
import {SHAKEDEX_URL} from '../util/shakedex';

const jsonSchemaValidate = require('jsonschema').validate;
const {SwapProof} = require('shakedex/src/swapProof');

export enum ActionTypes {
  UPLOAD_AUCTION_START = 'auctions/uploadAuctionStart',
  UPLOAD_AUCTION_END = 'auctions/uploadAuctionEnd',
  UPDATE_REMOTE_PAGE = 'auctions/updateRemotePage',
  UPDATE_REMOTE_TOTAL = 'auctions/updateRemoteTotal',
  ADD_LOCAL_AUCTION = 'auctions/addLocalAuction',
  ADD_REMOTE_AUCTIONS = 'auctions/addRemoteAuctions',
  SET_REMOTE_AUCTIONS = 'auctions/setRemoteAuctions',
  DELETE_LOCAL_AUCTION = 'auctions/deleteLocalAuction',
  ADD_AUCTION_BY_TLD = 'auctions/addAuctionByTLD',
  SET_SEARCH = 'auctions/setSearch',
  SET_FILTER_FIELD = 'auctions/setFilterField',
  TOGGLE_LOADING = 'auctions/toggleLoading',
  TOGGLE_SORT_FIELD = 'auctions/toggleSortField'
}

type Action<payload> = {
  type: ActionTypes;
  payload: payload;
  meta?: any;
  error?: boolean;
}

export type SortField = 'createdAt' | 'currentBid' | 'name' | 'status';

export type SortDirection = -1 | 1

export type State = {
  uploading: boolean;
  loading: boolean;
  local: string[];
  remote: string[];
  byTLD: {
    [tld: string]: AuctionState;
  };
  remoteTotal: number;
  search: string;
  filters: Filters;
  sortField: SortField
  sortDirection: SortDirection
}

export type ProposalState = {
  lockTime: number;
  price: number;
  signature: string;
}

export type AuctionState = {
  id: number
  lockingOutputIdx: number;
  lockingTxHash: string;
  name: string;
  paymentAddr: string;
  publicKey: string;
  data: ProposalState[];
  spendingStatus: 'COMPLETED' | 'CANCELLED' | null;
  spendingTxHash: string | null;
}

type AuctionResponseJSON = {
  id: number;
  name: string;
  publicKey: string;
  paymentAddr: string;
  lockingTxHash: string;
  lockingOutputIdx: number;
  createdAt: number;
  updatedAt: number;
  spendingStatus: 'COMPLETED' | 'CANCELLED' | null;
  spendingTxHash: string | null;
  bids: {
    price: number;
    signature: string;
    lockTime: number;
  }[];
}

export type FilterStatus = 'COMPLETED' | 'CANCELLED' | 'ACTIVE';

export interface Filters {
  includePunycode: boolean
  includeAscii: boolean
  minLength: number
  maxLength: number
  statuses: FilterStatus[]
  before?: number
  after?: number
  minCurrentBid: number
  maxCurrentBid: number
}

export interface SetFilterFieldPayload {
  field: keyof Filters
  value: any
}

const defaultFilters: Filters = {
  includePunycode: true,
  includeAscii: true,
  minLength: 1,
  maxLength: 64,
  statuses: ['ACTIVE'],
  minCurrentBid: 0,
  maxCurrentBid: 1000000 * 1e6
};

const initialState: State = {
  uploading: false,
  loading: false,
  local: [],
  remote: [],
  remoteTotal: 0,
  byTLD: {},
  search: '',
  filters: defaultFilters,
  sortField: 'createdAt',
  sortDirection: -1
};

export const submitAuction = (auctionJSON: AuctionState) => async (dispatch: Dispatch) => {
  dispatch({type: ActionTypes.UPLOAD_AUCTION_START});

  try {
    const resp = await fetch(`${SHAKEDEX_URL}/api/v2/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({auction: auctionJSON})
    });
    const json = await resp.json();

    if (json.error) throw new Error(json.error.message);
    dispatch({type: ActionTypes.UPLOAD_AUCTION_END});
  } catch (e) {
    dispatch({type: ActionTypes.UPLOAD_AUCTION_END});
    throw e;
  }
};

const PER_PAGE = 50;

export const fetchRemoteAuctions = (page: number = 1, search: string | null = null) => async (dispatch: Dispatch, getState: () => { auctions: State }) => {
  const {filters, sortDirection, sortField} = getState().auctions;
  const queryString = makeQueryString({
    page,
    per_page: PER_PAGE,
    search,
    filters: filters ? JSON.stringify(filters) : null,
    sort_field: sortField,
    sort_direction: sortDirection
  });
  dispatch(toggleLoading(true));
  let json: {
    auctions: AuctionResponseJSON[],
    total: number,
  };
  try {
    const resp = await fetch(`${SHAKEDEX_URL}/api/v2/auctions${queryString}`);
    json = await resp.json();
  } finally {
    dispatch(toggleLoading(false));
  }

  dispatch({
    type: ActionTypes.UPDATE_REMOTE_PAGE,
    payload: page,
  });

  dispatch({
    type: ActionTypes.UPDATE_REMOTE_TOTAL,
    payload: json.total,
  });

  dispatch(setRemoteAuctions([]));

  dispatch(addRemoteAuctions(json.auctions.map(auction => ({
    id: auction.id,
    name: auction.name,
    lockingTxHash: auction.lockingTxHash,
    lockingOutputIdx: auction.lockingOutputIdx,
    publicKey: auction.publicKey,
    paymentAddr: auction.paymentAddr,
    data: auction.bids.map(bid => ({
      price: bid.price,
      signature: bid.signature,
      lockTime: bid.lockTime,
    })),
    spendingStatus: auction.spendingStatus,
    spendingTxHash: auction.spendingTxHash,
  }))));
};

export const toggleSortField = (page: number = 1, search: string | null = null, sortField: SortField, sortDirection: SortDirection) => async (dispatch: Dispatch) => {
  dispatch({
    type: ActionTypes.TOGGLE_SORT_FIELD,
    payload: {
      sortField,
      sortDirection,
    }
  });

  await dispatch(fetchRemoteAuctions(page, search) as any);
};

export const fetchAuctionByTLD = (tld: string) => async (dispatch: Dispatch) => {
  const resp = await fetch(`${SHAKEDEX_URL}/api/v2/auctions/n/${tld}`);
  const json: {
    auction: AuctionResponseJSON,
  } = await resp.json();
  const {auction} = json;

  if (!auction) return;

  const auctionJSON = {
    id: auction.id,
    name: auction.name,
    lockingTxHash: auction.lockingTxHash,
    lockingOutputIdx: auction.lockingOutputIdx,
    publicKey: auction.publicKey,
    paymentAddr: auction.paymentAddr,
    data: auction.bids.map(bid => ({
      price: bid.price,
      signature: bid.signature,
      lockTime: bid.lockTime,
    })),
    spendingStatus: auction.spendingStatus,
    spendingTxHash: auction.spendingTxHash,
  };

  dispatch(addAuctionByTLD(auctionJSON));
};

export const setRemoteAuctions = (auctions: AuctionState[]): Action<AuctionState[]> => {
  return {
    type: ActionTypes.SET_REMOTE_AUCTIONS,
    payload: auctions,
  };
};

export const addRemoteAuctions = (auctions: AuctionState[]): Action<AuctionState[]> => {
  return {
    type: ActionTypes.ADD_REMOTE_AUCTIONS,
    payload: auctions,
  };
};

export const addAuctionByTLD = (auction: AuctionState): Action<AuctionState> => {
  return {
    type: ActionTypes.ADD_AUCTION_BY_TLD,
    payload: auction,
  };
};

export const addLocalAuction = (auction: AuctionState): Action<AuctionState> => {
  return {
    type: ActionTypes.ADD_LOCAL_AUCTION,
    payload: auction,
  };
};

export const toggleLoading = (loading: boolean): Action<boolean> => {
  return {
    type: ActionTypes.TOGGLE_LOADING,
    payload: loading,
  };
};

export const removeLocalAuction = (tld: string): Action<string> => {
  return {
    type: ActionTypes.DELETE_LOCAL_AUCTION,
    payload: tld,
  };
};

export const uploadAuctions = (filelist: FileList | null) => async (
  dispatch: Dispatch,
  getState: () => {
    app: { apiHost: string; apiKey: string },
    auctions: State,
  },
) => {
  if (!filelist) return;
  const {app: {apiHost, apiKey}, auctions: {local}} = getState();
  const nodeClient = new NodeClient({apiHost, apiKey});
  const files = Array.from(filelist);
  for (const file of files) {
    const json = await readJSON(file);
    await assertAuction(json, nodeClient);
    const exists = local.reduce((acc, name) => {
      return acc || json.name === name;
    }, false);

    if (exists) {
      throw new Error(`Auction for ${json.name} already exists.`);
    }

    dispatch(addLocalAuction(json as AuctionState));
  }
};

export const setFilterField = (field: keyof Filters, value: any): Action<SetFilterFieldPayload> => {
  return {
    type: ActionTypes.SET_FILTER_FIELD,
    payload: {
      field,
      value
    }
  };
};

export default function auctionsReducer (state: State = initialState, action: Action<any>): State {
  switch (action.type) {
    case ActionTypes.SET_SEARCH:
      return {
        ...state,
        search: action.payload,
      };
    case ActionTypes.UPDATE_REMOTE_TOTAL:
      return {
        ...state,
        remoteTotal: action.payload,
      };
    case ActionTypes.UPLOAD_AUCTION_START:
      return {
        ...state,
        uploading: true,
      };
    case ActionTypes.UPLOAD_AUCTION_END:
      return {
        ...state,
        uploading: false,
      };
    case ActionTypes.SET_REMOTE_AUCTIONS:
      return {
        ...state,
        remote: action.payload,
      };
    case ActionTypes.ADD_AUCTION_BY_TLD:
      return {
        ...state,
        byTLD: {
          ...state.byTLD,
          [action.payload.name]: action.payload,
        },
      };
    case ActionTypes.ADD_REMOTE_AUCTIONS:
      return reduceAddRemoteAuctions(state, action);
    case ActionTypes.ADD_LOCAL_AUCTION:
      return reduceAddLocalAuction(state, action);
    case ActionTypes.DELETE_LOCAL_AUCTION:
      return reduceDeleteLocalAuction(state, action);
    case ActionTypes.SET_FILTER_FIELD:
      return reduceSetFilterField(state, action);
    case ActionTypes.TOGGLE_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case ActionTypes.TOGGLE_SORT_FIELD:
      return {
        ...state,
        sortField: action.payload.sortField,
        sortDirection: action.payload.sortDirection
      };
    default:
      return state;
  }
}

function reduceSetFilterField (state: State, action: Action<SetFilterFieldPayload>): State {
  return {
    ...state,
    filters: {
      ...state.filters,
      [action.payload.field]: action.payload.value
    }
  };
}

function reduceDeleteLocalAuction (state: State, action: Action<string>): State {
  return {
    ...state,
    local: state.local.filter((name) => name !== action.payload),
  };
}

function reduceAddRemoteAuctions (state: State, action: Action<AuctionState[]>): State {
  const {remote} = state;
  return {
    ...state,
    remote: [...remote, ...action.payload.map(({name}) => name)],
    byTLD: {
      ...state.byTLD,
      ...action.payload.reduce((acc: State['byTLD'], auction) => {
        acc[auction.name] = auction;
        return acc;
      }, {}),
    },
  };
}

function reduceAddLocalAuction (state: State, action: Action<AuctionState>): State {
  const {local} = state;
  const newAuctionState = action.payload;
  const exists = local.reduce((acc, name) => {
    return acc || newAuctionState.name === name;
  }, false);

  if (!exists) {
    const newLocal = [...local, newAuctionState.name];
    state.local = newLocal;
    state.byTLD[newAuctionState.name] = newAuctionState;
  }

  return state;
}

export const useLocalAuctions = (): AuctionState[] => {
  return useSelector((state: { auctions: State }) => {
    return state.auctions.local.map(name => state.auctions.byTLD[name]);
  }, (a, b) => deepEqual(a, b));
};

export const useRemoteAuctionByIndex = (index: number): AuctionState | undefined => {
  return useSelector((state: { auctions: State }) => {
    return state.auctions.byTLD[state.auctions.remote[index]];
  }, (a, b) => deepEqual(a, b));
};

export const useLocalAuctionByIndex = (index: number): AuctionState | undefined => {
  return useSelector((state: { auctions: State }) => {
    return state.auctions.byTLD[state.auctions.local[index]];
  }, (a, b) => deepEqual(a, b));
};

export const useRemoteAuctions = (): AuctionState[] => {
  return useSelector((state: { auctions: State }) => {
    return state.auctions.remote.map(name => state.auctions.byTLD[name]);
  }, (a, b) => deepEqual(a, b));
};

export const useAuctionByTLD = (tld: string): AuctionState | null => {
  return useSelector((state: { auctions: State }) => {
    const {byTLD} = state.auctions;
    return byTLD[tld] || null;
  }, (a, b) => deepEqual(a, b));
};

export const useAuctionsUploading = (): boolean => {
  return useSelector((state: { auctions: State }) => {
    return state.auctions.uploading;
  }, (a, b) => deepEqual(a, b));
};

export async function readJSON (file: File): Promise<AuctionState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function fileReadCompleted () {
      resolve(JSON.parse(reader.result as string));
    };
    reader.readAsText(file);
  });
}

export async function assertAuction (auctionJSON: AuctionState, nodeClient: NodeClient) {
  const res = jsonSchemaValidate(auctionJSON, auctionSchema);

  if (!res.valid) {
    throw new Error('Invalid auction schema.');
  }

  const proofs = auctionJSON.data.map(a => new SwapProof({
    name: auctionJSON.name,
    lockingTxHash: auctionJSON.lockingTxHash,
    lockingOutputIdx: auctionJSON.lockingOutputIdx,
    publicKey: auctionJSON.publicKey,
    paymentAddr: auctionJSON.paymentAddr,
    price: a.price,
    lockTime: a.lockTime,
    signature: a.signature,
  }));

  for (const proof of proofs) {
    try {
      const ok = await proof.verify({nodeClient});
      if (!ok) {
        throw new Error('Swap proofs failed validation.');
      }
    } catch (e) {
      console.error(e);
      throw new Error('Swap proofs failed validation.');
    }

  }
}


const hexRegex = (len: number | null) => {
  return new RegExp(`^[a-f0-9]${len ? `{${len}}` : '+'}$`);
};

const addressRegex = /^(hs|rs|ts|ss)1[a-zA-HJ-NP-Z0-9]{25,39}$/i;

const auctionSchema = {
  type: 'object',
  required: [
    'name',
    'lockingTxHash',
    'lockingOutputIdx',
    'publicKey',
    'paymentAddr',
    'data',
  ],
  properties: {
    name: {
      type: 'string',
    },
    lockingTxHash: {
      type: 'string',
      pattern: hexRegex(64),
    },
    lockingOutputIdx: {
      type: 'integer',
      minimum: 0,
    },
    publicKey: {
      type: 'string',
      pattern: hexRegex(66),
    },
    paymentAddr: {
      type: 'string',
      pattern: addressRegex,
    },
    data: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'price',
          'lockTime',
          'signature',
        ],
        properties: {
          price: {
            type: 'integer',
            minimum: 0,
          },
          lockTime: {
            type: 'integer',
            minimum: 1610000000,
          },
          signature: {
            type: 'string',
            pattern: hexRegex(130),
          },
        },
      },
    },
  },
};

const makeQueryString = (opts: object): string => {
  const out = [];
  for (const [k, v] of Object.entries(opts)) {
    if (typeof v === 'undefined') {
      continue;
    }
    out.push(`${k}=${encodeURIComponent(v)}`);
  }
  if (out.length === 0) {
    return '';
  }
  return '?' + out.join('&');
};