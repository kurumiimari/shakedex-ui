import React, {ChangeEvent, MouseEvent, ReactElement, useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";

import AppContent from "../../components/AppContent";
import Button, {ButtonType} from "../../components/Button";
import {
  fetchMoreRemoteAuctions,
  fetchRemoteAuctions, readJSON,
  removeLocalAuction, setSearchParam, submitAuction,
  uploadAuctions,
  useLocalAuctionByIndex,
  useLocalAuctions, useRemoteAuctionByIndex, useRemoteAuctions, useSearchParam
} from "../../ducks/auctions";
import Card, {CardHeader} from "../../components/Card";

import "./listing-view.scss";
import {Auction} from "../../util/auction";
import {useHistory} from "react-router";
import {useCurrentBlocktime} from "../../ducks/handshake";
import {formatNumber, fromDollaryDoos} from "../../util/number";
import classNames from "classnames";
import Icon from "../../components/Icon";
import Modal, {ModalContent, ModalHeader} from "../ModalRoot";
import {useDevMode} from "../../ducks/app";
import {InputWithIcon} from "../../components/Input";
import {Loader} from "../../components/Loader";

export default function ListingView() {
  const devMode = useDevMode();

  return (
    <AppContent className="listing-view">
      {/*{*/}
      {/*  !remotes.length && (*/}
      {/*    <SystemMessage type={SystemMessageType.error}>*/}
      {/*      <div>ShakeDex API is currently unavailable 😵</div>*/}
      {/*      <div>You may still manually upload presigns to view and fulfill auction.</div>*/}
      {/*    </SystemMessage>*/}
      {/*  )*/}
      {/*}*/}
      <div className="listing-view__content">
        <RemoteAuctions />
        { devMode && <LocalAuctions /> }
      </div>
    </AppContent>
  );
}

function RemoteAuctions(): ReactElement {
  const remoteAuctions = useRemoteAuctions();
  const dispatch = useDispatch();
  const [el, setElement] = useState<HTMLTableSectionElement | null>(null);
  const [errMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParam();

  useEffect(() => {
    (async function() {
      await dispatch(fetchRemoteAuctions());
      setLoading(false);
    })();
  }, []);

  const onScroll = useCallback(async () => {
    if (!el) return;
    const {offsetHeight, scrollHeight, scrollTop} = el;
    if (offsetHeight + scrollTop >= scrollHeight) {
      await dispatch(fetchMoreRemoteAuctions());
    }
  }, [el]);

  const onSearch = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchRemoteAuctions());
    setLoading(false);
  }, []);

  const onSearchInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchParam(e.target.value));
  }, []);

  return (
    <Card className="remote-auctions">
      <CardHeader title="Auctions">
        {errMessage && <div className="local-auctions__error-message">{errMessage}</div>}
        <InputWithIcon
          placeholder="Search by keyword"
          material="search"
          size={1.5}
          value={searchParams}
          onChange={onSearchInputChange}
          onIconClick={onSearch}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        />
        <SubmitButton
          setErrorMessage={setErrorMessage}
        />
      </CardHeader>
      <div className="remote-auctions__content">
        <table>
          <thead>
            <tr>
              <td>Domain Name</td>
              <td>Status</td>
              <td>Price (HNS)</td>
              <td>Decrement</td>
            </tr>
          </thead>
          <tbody ref={(element) => setElement(element)} onScroll={onScroll}>
          {
            !loading && remoteAuctions.map((auctionOption, i) => {
              const auction = new Auction(auctionOption);
              return (
                <RemoteAuctionRow
                  key={`remote-${auction.tld}-${auction.startTime.getTime()}=${auction.priceDecrement}`}
                  auctionIndex={i}
                />
              );
            })
          }
          {
            !remoteAuctions.length && !loading && (
              <tr className="remote-auctions__empty-row">
                No data to display
              </tr>
            )
          }
          {loading && (
            <tr className="loading">
              <Loader />
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function LocalAuctions(): ReactElement {
  const localAuctions = useLocalAuctions();
  const [errMessage, setErrorMessage] = useState('');

  return (
    <Card className="local-auctions">
      <CardHeader title="Local Auctions">
        {errMessage && <div className="local-auctions__error-message">{errMessage}</div>}
        <UploadButton
          setErrorMessage={setErrorMessage}
        />
      </CardHeader>
      <div className="local-auctions__content">
        <table>
          <thead>
            <tr>
              <td>Domain Name</td>
              <td>Status</td>
              <td>Price (HNS)</td>
              <td>Decrement</td>
              <td>&#x2800;</td>
            </tr>
          </thead>
          <tbody>
            {
              localAuctions.map((auctionOption, i) => {
                const auction = new Auction(auctionOption);

                return (
                  <LocalAuctionRow
                    key={`local-${auction.tld}-${auction.startTime.getTime()}=${auction.priceDecrement}`}
                    auctionIndex={i}
                  />
                );
              })
            }
            {
              !localAuctions.length && (
                <tr className="local-auctions__empty-row">
                  No data to display
                </tr>
              )
            }
          </tbody>
        </table>
      </div>
    </Card>

  )
}

function RemoteAuctionRow(props: { auctionIndex: number }) {
  const auctionOption = useRemoteAuctionByIndex(props.auctionIndex);
  const currentTime = new Date();
  const history = useHistory();

  if (!auctionOption) return <></>;

  const auction = new Auction(auctionOption);
  const status = auction.getStatus(currentTime);
  const statusText = auction.getStatusText(currentTime);
  const price = auction.getCurrentPrice(currentTime);

  return (
    <tr
      onClick={() => history.push(`/a/${auction.tld}`)}
    >
      <td>{auction.tld}</td>
      <td className={classNames({
        'local-auctions__status--listed': status === 'LISTED',
        'local-auctions__status--started': status === 'STARTED',
        'local-auctions__status--ended': status === 'ENDED' || status === 'COMPLETED',
      })}>
        {statusText}
      </td>
      <td>{formatNumber(fromDollaryDoos(price))}</td>
      <td>{formatNumber(fromDollaryDoos(auction.priceDecrement)) + ` / ${auction.decrementUnit}`}</td>
    </tr>
  );
}

function LocalAuctionRow(props: { auctionIndex: number }) {
  const auctionOption = useLocalAuctionByIndex(props.auctionIndex);
  const currentTime = useCurrentBlocktime();
  const history = useHistory();
  const dispatch = useDispatch();

  const [isConfirming, setConfirming] = useState(false);
  const removeAuction = useCallback(() => {
    if (!auctionOption?.name) {
      return;
    }
    dispatch(removeLocalAuction(auctionOption?.name));
    setConfirming(false);
  }, [dispatch, auctionOption?.name]);

  if (!auctionOption) return <></>;

  const auction = new Auction(auctionOption);

  const status = auction.getStatus(currentTime);
  const statusText = auction.getStatusText(currentTime);
  const price = auction.getCurrentPrice(currentTime);

  return (
    <tr
      key={auction.tld + auction.durationDays + auction.startPrice + auction.startTime}
      onClick={() => history.push(`/a/${auction.tld}`)}
    >
      <td>{auction.tld}</td>
      <td className={classNames({
        'local-auctions__status--listed': status === 'LISTED',
        'local-auctions__status--started': status === 'STARTED',
        'local-auctions__status--ended': status === 'ENDED' || status === 'COMPLETED',
      })}>
        {statusText}
      </td>
      <td>{formatNumber(fromDollaryDoos(price))}</td>
      <td>{formatNumber(fromDollaryDoos(auction.priceDecrement)) + ` / ${auction.decrementUnit}`}</td>
      <td>
        <Icon
          className="delete-btn"
          material="delete"
          size={1.5}
          onClick={e => {
            e.stopPropagation();
            setConfirming(true);
          }}
        />
      </td>
      {
        isConfirming && (
          <Modal onClose={() => setConfirming(false)}>
            <ModalHeader>{`Are you sure you want to delete ${auction.tld}?`}</ModalHeader>
            <ModalContent>
              <p>You cannot undo this action.</p>
              <div className="local-auctions__modal-actions">
                <Button
                  btnType={ButtonType.secondary}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={removeAuction}
                >
                  Confirm
                </Button>
              </div>
            </ModalContent>
          </Modal>
        )
      }
    </tr>
  );
}

function UploadButton(props: {
  setErrorMessage: (msg: string) => void;
}) {
  const dispatch = useDispatch();
  const { setErrorMessage } = props;
  const [timed, setTimedout] = useState<any>();
  const local = useLocalAuctions();

  const onFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (timed) clearTimeout(timed);

    setErrorMessage('');
    try {
      await dispatch(uploadAuctions(e.target.files));
    } catch (e) {
      setErrorMessage(e.message);
      const timeout = setTimeout(() => setErrorMessage(''), 15000);
      setTimedout(timeout);
    }
  }, [timed, local]);

  return (
    <Button className="upload-auction-btn">
      Upload Presigns
      <input
        type="file"
        accept="application/json"
        onChange={onFileUpload}
        multiple
      />
    </Button>
  )
}

function SubmitButton(props: {
  setErrorMessage: (msg: string) => void;
}) {
  const dispatch = useDispatch();
  const { setErrorMessage } = props;
  const [timed, setTimedout] = useState<any>();
  const local = useLocalAuctions();

  const onFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (timed) clearTimeout(timed);

    setErrorMessage('');

    try {
      const file: File = e.target.files![0];
      const auctionJSON = await readJSON(file);
      await dispatch(submitAuction(auctionJSON));
    } catch (e) {
      setErrorMessage(e.message);
      const timeout = setTimeout(() => setErrorMessage(''), 15000);
      setTimedout(timeout);
    }
  }, [timed, local]);

  return (
    <Button className="upload-auction-btn">
      <span>Submit Listing</span>
      <Icon
        material="upload"
        size={1.5}
      />
      <input
        type="file"
        accept="application/json"
        onChange={onFileUpload}
      />
    </Button>
  )
}
