import React, {useEffect} from "react";
import {useRouteMatch} from "react-router";
import {useDispatch} from "react-redux";

import AuctionOverview from "../../components/AuctionOverviewCard";
import AuctionStatusCard from "../../components/AuctionStatusCard";
import DomainDetailCard from "../../components/DomainDetailCard";
import {fetchDomain} from "../../ducks/domains";

import "./auction.scss";
import Comparables from "../../components/Comparables";
import AuctionChart from "../../components/AuctionChartCard";
import AuctionInfoCard from "../../components/AuctionInfoCard";
import {useAPI} from "../../ducks/app";
import {fetchAuctionByTLD} from "../../ducks/auctions";
import AuctionSoldBanner from "../../components/AuctionSoldBanner";

export default function TLDAuctionView() {
  const { params } = useRouteMatch<{tld: string}>();
  const dispatch = useDispatch();
  const {apiHost, apiKey} = useAPI();
  const tld = params?.tld;

  useEffect(() => {
    dispatch(fetchDomain(tld));
    dispatch(fetchAuctionByTLD(tld));
  }, [
    tld,
    dispatch,
    apiHost,
    apiKey,
  ]);

  return (
    <div className="auction">
      <AuctionSoldBanner tld={tld} />
      <AuctionOverview tld={tld} />
      <AuctionStatusCard tld={tld} />
      <AuctionChart tld={tld} />
      <AuctionInfoCard tld={tld} />
      <DomainDetailCard tld={tld} />
      <Comparables tld={tld} />
    </div>
  )
}
