import {createStore, applyMiddleware, combineReducers} from "redux";
import thunk from "redux-thunk";
import {createLogger} from "redux-logger";
import app from "../ducks/app";
import domains from "../ducks/domains";
import auctions from "../ducks/auctions";
import handshake from "../ducks/handshake";
import stats from '../ducks/stats';
import ls from "./localStorage";

const rootReducer = combineReducers({
  app,
  domains,
  auctions,
  handshake,
  stats,
});

export type AppRootState = ReturnType<typeof rootReducer>;

export default function configureAppStore() {
  return createStore(
    rootReducer,
    process.env.NODE_ENV === 'development'
      ? applyMiddleware(
        thunk,
        createLogger({
          collapsed: (getState, action = {}) => [''].includes(action.type),
        }),
        ls,
      )
      : applyMiddleware(
        thunk,
        ls,
      ),
  );
}
