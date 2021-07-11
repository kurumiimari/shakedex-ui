import React, {useCallback, useEffect, useState} from 'react';
import {useHistory} from "react-router";
import Icon from "../Icon";
import Logo from "../../../static/assets/icons/museum.svg";

import "./app-header.scss";
import {useURLSearch} from '../../hooks';
import {InputWithIcon} from '../Input';
import { Link } from 'react-router-dom'


export default function AppHeader() {
  const history = useHistory();
  const goHome = useCallback(() => history.push('/'), []);
  const goSetting = useCallback(() => history.push('/settings'), []);
  const urlSearch = useURLSearch();
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const onSearch = useCallback(async () => {
    if (!searchQuery) {
      history.push('/');
      return;
    }
    history.push(`/?search=${searchQuery}`);
  }, [searchQuery]);

  return (
    <div className="header">
      <div className="header__content">
        <div className="header__content__l">
          <Icon
            url={Logo}
            size={2.25}
            onClick={goHome}
            className="mr-4"
          />
          <Link
            className="font-bold text-pink-500 mr-2"
            to="/"
          >
            Home
          </Link>
          <Link
            className="font-bold text-pink-500"
            to="/stats"
          >
            Stats
          </Link>
        </div>
        <div className="header__content__r">
          <div className="mr-2 flex items-center">
            <InputWithIcon
              placeholder="Search by keyword"
              material="search"
              size={1.5}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onIconClick={onSearch}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onSearch();
                }
              }}
            />
          </div>
          <Icon
            className="setting-icon"
            material="settings"
            size={2.25}
            onClick={goSetting}
          />
        </div>
      </div>
    </div>
  );
}

