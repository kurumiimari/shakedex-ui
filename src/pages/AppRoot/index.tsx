import React, {useEffect} from 'react';
import {Redirect, Route, Switch} from "react-router";

import AppHeader from "../../components/AppHeader";

import "./app.scss";
import ListingView from "../ListingView";
import TLDAuctionView from "../TLDAuctionView";
import {useDispatch} from "react-redux";
import {fetchHandshake} from "../../ducks/handshake";
import {SettingsView} from "../SettingsView";
import {initApp} from "../../ducks/app";


export default function AppRoot() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initApp());
    dispatch(fetchHandshake());
  }, []);

  return (
    <div className="app">
      <AppHeader />
      <div className="app__content">
        <Switch>
          <Route
            path="/a/:tld"
            component={TLDAuctionView}
          />
          <Route
            path="/settings"
            component={SettingsView}
          />
          <Route
            path="/page/:page"
            component={ListingView}
          />
          <Route
            path="/"
            component={ListingView}
          />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </div>
    </div>
  )
}

