import React, {ChangeEvent, ReactElement, useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import AppContent from '../../components/AppContent';
import Button, {ButtonType} from '../../components/Button';
import {
  fetchRemoteAuctions,
  readJSON,
  removeLocalAuction,
  SortDirection,
  SortField,
  State,
  submitAuction,
  toggleSortField,
  uploadAuctions,
  useLocalAuctionByIndex,
  useLocalAuctions,
  useRemoteAuctionByIndex,
  useRemoteAuctions,
} from '../../ducks/auctions';
import Card, {CardHeader} from '../../components/Card';

import './listing-view.scss';
import {Auction} from '../../util/auction';
import {useHistory, useRouteMatch} from 'react-router';
import {Link} from 'react-router-dom';
import {useCurrentBlocktime} from '../../ducks/handshake';
import {formatNumber, fromDollaryDoos} from '../../util/number';
import classNames from 'classnames';
import Icon from '../../components/Icon';
import Modal, {ModalContent, ModalHeader} from '../ModalRoot';
import {useDevMode} from '../../ducks/app';
import {Loader} from '../../components/Loader';
import TLD from '../../components/TLD';
import Countdown from '../../components/Countdown';
import ListingFilters from '../../components/ListingFilters';
import {useURLSearch} from '../../hooks';

export default function ListingView () {
  const devMode = useDevMode();
  const {params} = useRouteMatch<{ page: string | undefined }>();

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
      <div>
        <RemoteAuctions page={Number(params.page || 1)} />
        {devMode && <LocalAuctions />}
      </div>
    </AppContent>
  );
}

function RemoteAuctions (props: { page: number }): ReactElement {
  const remoteAuctions = useRemoteAuctions();
  const {remoteTotal, loading} = useSelector((state: { auctions: State }) => state.auctions);
  const dispatch = useDispatch();
  const [errMessage, setErrorMessage] = useState('');
  const urlSearch = useURLSearch();
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    (async function () {
      await dispatch(fetchRemoteAuctions(props.page, urlSearch));
    })();
  }, [props.page, urlSearch]);

  return (
    <div className="md:pt-4">
      {errMessage && <div className="local-auctions__error-message">{errMessage}</div>}
      <div className="overflow-hidden rounded-sm">
        <div className="flex bg-gray-700 p-4 items-center">
          <h1 className="text-xl font-bold col-span-4 mr-auto">Auctions</h1>
          <SubmitButton
            setErrorMessage={setErrorMessage}
          />
        </div>
        <div
          className="bg-gray-900 px-4 py-2"
        >
          <div className="pb-4 pt-2">
            <ListingFilters
              isVisible={filtersVisible}
              toggle={setFiltersVisible}
              page={props.page}
              search={urlSearch}
            />
          </div>
          <div>
            <div className="grid-cols-5 gap-4 px-4 py-2 mb-2 hidden md:grid">
              <AuctionTableHeader
                title="Name"
                sortable
                sortField="name"
                page={props.page}
                search={urlSearch}
              />
              <AuctionTableHeader
                title="Status"
                sortable
                sortField="status"
                page={props.page}
                search={urlSearch}
              />
              <AuctionTableHeader
                title="Current Bid"
                sortable
                sortField="currentBid"
                page={props.page}
                search={urlSearch}
              />
              <AuctionTableHeader
                title="Next Bid In"
              />
              <AuctionTableHeader
                title="Decrement"
              />
            </div>
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
              <div className="flex justify-center">
                <Loader />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="py-4 md:px-0 px-4">
        <Pagination page={props.page} perPage={50} total={remoteTotal} />
      </div>
    </div>
  );
}

function LocalAuctions (): ReactElement {
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

  );
}

function RemoteAuctionRow (props: { auctionIndex: number }) {
  const auctionOption = useRemoteAuctionByIndex(props.auctionIndex);
  const currentTime = new Date();
  const history = useHistory();

  if (!auctionOption) return <></>;

  const auction = new Auction(auctionOption);
  const status = auction.getStatus(currentTime);
  const price = auction.getCurrentPrice(currentTime);
  const nextDecrementAt = auction.getNextDecrement(currentTime);

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 py-2 bg-gray-700 mb-4 rounded-md cursor-pointer items-center"
      onClick={() => history.push(`/a/${auction.tld}`)}
    >
      <div className="text-pink-500"><TLD tld={auction.tld} /></div>
      <div className="flex">
        <div className="ml-auto md:ml-0">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="col-span-2 md:hidden grid grid-cols-3 gap-4">
        <div className="text-gray-300">
          <span className="text-gray-500 text-sm font-medium">Current Bid</span><br />
          {formatNumber(fromDollaryDoos(price))}{' '}
        </div>
        <div className="text-gray-300">
          <span className="text-gray-500 text-sm font-medium">Next Bid In</span><br />
          <div className="font-mono">
            {(status === 'CANCELLED' || status === 'COMPLETED') && (
              <span className="text-gray-500">-</span>
            )}
            {(status === 'LISTED' || status === 'STARTED') && (
              nextDecrementAt ?
                <Countdown
                  date={nextDecrementAt}
                />
                : <span className="text-gray-500">-</span>
            )}
            {status === 'ENDED' && (
              <span className="text-gray-500">-</span>
            )}
          </div>
        </div>
        <div className="text-gray-300">
          <span className="text-gray-500 text-sm font-medium">Decrement</span><br />
          {formatNumber(fromDollaryDoos(auction.priceDecrement))}{' '}
          <span className="text-gray-500 text-sm font-medium">/ {auction.decrementUnit}</span>
        </div>
      </div>
      <div className="text-gray-300 hidden md:block">
        {formatNumber(fromDollaryDoos(price))}{' '}
        <span className="text-gray-500 text-sm font-medium">HNS</span>
      </div>
      <div className="text-gray-300 font-mono hidden md:block">
        {(status === 'CANCELLED' || status === 'COMPLETED') && (
          <span className="text-gray-500">-</span>
        )}
        {(status === 'LISTED' || status === 'STARTED') && (
          nextDecrementAt ?
            <Countdown
              date={nextDecrementAt}
            />
            : <span className="text-gray-500">-</span>
        )}
        {status === 'ENDED' && (
          <span className="text-gray-500">-</span>
        )}
      </div>
      <div className="text-gray-300 hidden md:block">
        {formatNumber(fromDollaryDoos(auction.priceDecrement))}{' '}
        <span className="text-gray-500 text-sm font-medium">HNS / {auction.decrementUnit}</span>
      </div>
    </div>
  );
}

function LocalAuctionRow (props: { auctionIndex: number }) {
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

interface AuctionTableHeaderProps {
  title: string
  sortable?: boolean
  sortField?: SortField
  search?: string | null
  page?: number
}

const noop = () => null;

const AuctionTableHeader = (props: AuctionTableHeaderProps) => {
  const dispatch = useDispatch();
  const {sortField, sortDirection} = useSelector((state: { auctions: State }) => state.auctions);
  const onClick = props.sortable ? () => {
    let nextSortDirection: SortDirection | null;
    if (sortField === props.sortField) {
      if (sortDirection === 1) {
        nextSortDirection = -1;
      } else {
        nextSortDirection = null;
      }
    } else {
      nextSortDirection = 1;
    }

    dispatch(toggleSortField(
      props.page!,
      props.search!,
      nextSortDirection === null ? 'createdAt' : props.sortField!,
      nextSortDirection === null ? -1 : nextSortDirection
    ));
  } : noop;

  return (
    <div
      className="text-sm font-medium text-gray-500 flex items-center"
      onClick={onClick}
    >
      {props.title}
      {sortField === props.sortField && (
        <Icon
          material={sortDirection === 1 ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          size={1}
        />
      )}
    </div>
  );
};

const Pagination = (props: { page: number, perPage: number, total: number }) => {
  const urlSearch = useURLSearch();

  return (
    <div className="flex">
      <Link
        to={props.page === 1 ? '#' : pageURL(props.page - 1, urlSearch)}
        className="flex-initial mr-auto p-2 bg-gray-800 rounded-md w-10 h-10 flex align-center justify-center"
      >
        <Icon
          size={1.25}
          material="chevron_left"
        />
      </Link>
      <Link
        className="flex-initial ml-auto p-2 bg-gray-800 rounded-md w-10 h-10 flex align-center justify-center"
        to={pageURL(props.page + 1, urlSearch)}
      >
        <Icon
          size={1.25}
          material="chevron_right"
        />
      </Link>
    </div>
  );
};

const StatusBadge = (props: { status: string }) => {
  let color;
  let text;

  switch (props.status) {
    case 'COMPLETED':
      color = 'green-500';
      text = 'Sold';
      break;
    case 'CANCELLED':
      color = 'red-500';
      text = 'Cancelled';
      break;
    case 'LISTED':
    case 'STARTED':
      color = 'pink-500';
      text = 'Bidding';
      break;
    case 'ENDED':
      color = 'pink-500';
      text = 'All Released';
      break;
  }

  return (
    <div
      className={classNames(
        'inline-block px-1 uppercase border rounded-sm text-xs font-medium',
        `text-${color}`,
        `border-${color}`,
      )}
    >
      {text}
    </div>
  );
};

function UploadButton (props: {
  setErrorMessage: (msg: string) => void;
}) {
  const dispatch = useDispatch();
  const {setErrorMessage} = props;
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
  );
}

function SubmitButton (props: {
  setErrorMessage: (msg: string) => void;
}) {
  const dispatch = useDispatch();
  const {setErrorMessage} = props;
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
    <div
      className="upload-auction-btn bg-pink-500 text-center rounded-sm font-bold px-2 flex items-center"
    >
      <span className="mr-2">Submit Listing</span>
      <Icon
        material="upload"
        size={1.5}
      />
      <input
        type="file"
        accept="application/json"
        onChange={onFileUpload}
      />
    </div>
  );
}

const pageURL = (page: number, search: string) => {
  let base = `/page/${page}`;
  if (search) {
    base += `?search=${encodeURIComponent(search)}`;
  }
  return base;
};