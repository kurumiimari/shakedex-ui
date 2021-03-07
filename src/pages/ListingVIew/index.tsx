import React, {ChangeEvent, ReactElement, useCallback, useState} from "react";
import {useDispatch} from "react-redux";

import AppContent from "../../components/AppContent";
import SystemMessage, {SystemMessageType} from "../../components/SystemMessage";
import Button, {ButtonType} from "../../components/Button";
import {removeLocalAuction, uploadAuctions, useLocalAuctionByIndex, useLocalAuctions} from "../../ducks/auctions";
import Card, {CardHeader} from "../../components/Card";

import "./listing-view.scss";
import {Auction} from "../../util/auction";
import {useHistory} from "react-router";
import {useCurrentBlocktime} from "../../ducks/handshake";
import {formatNumber, fromDollaryDoos} from "../../util/number";
import classNames from "classnames";
import Icon from "../../components/Icon";
import Modal, {ModalContent, ModalHeader} from "../ModalRoot";


export default function ListingView() {
  return (
    <AppContent className="listing-view">
      <SystemMessage type={SystemMessageType.error}>
        <div>ShakeDex API is currently unavailable 😵</div>
        <div>You may still manually upload presigns to view and fulfill auction.</div>
      </SystemMessage>
      <div className="listing-view__content">
        <LocalAuctions />
      </div>
    </AppContent>
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
              <td></td>
            </tr>
          </thead>
          <tbody>
            {
              localAuctions.map((auctionOption, i) => {
                const auction = new Auction(auctionOption);

                return (
                  <LocalAuctionRow
                    key={`${auction.tld}-${auction.startTime}=${auction.priceDecrement}`}
                    auctionIndex={i}
                  />
                );
              })
            }
          </tbody>
        </table>
      </div>
    </Card>

  )
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
        'local-auctions__status--ended': status === 'ENDED',
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

function UploadButton(props: { setErrorMessage: (msg: string) => void}) {
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
