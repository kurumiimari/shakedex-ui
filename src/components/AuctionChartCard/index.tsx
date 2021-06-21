import React, {ReactElement, useEffect, useState} from "react";
import moment from "moment";
import Card from "../Card";
import {useAuctionByTLD} from "../../ducks/auctions";
import {Auction} from "../../util/auction";
import {
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {fromDollaryDoos} from "../../util/number";

import "./auction-chart.scss";
import Button from "../Button";
import Icon from "../Icon";
import BobLogo from "../../../static/assets/icons/bob-white.svg";

type Props = {
  tld: string;
}

export default function AuctionChart(props: Props): ReactElement {
  const auctionState = useAuctionByTLD(props.tld);
  const currentBlocktime = new Date();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [hoverPrice, setHoverPrice] = useState(-1);
  const [hoverLocktime, setHoverLocktime] = useState('');

  const auction = new Auction(auctionState);
  const data = auction.getChartData();
  const startPriceTick = Number(fromDollaryDoos(auction.startPrice));
  const endPriceTick = Number(fromDollaryDoos(auction.endPrice));
  const currentPrice = auction.getCurrentPrice(currentBlocktime);
  const currentLockTime = auction.getCurrentTime(currentBlocktime);

  const chartWidth = document.body.clientWidth < 768
    ? document.body.clientWidth
    : 768;
  const chartHeight = document.body.clientWidth < 768
    ? chartWidth * (520 / 768)
    : 460.8;

  useEffect(() => {
    setHoverLocktime(moment(currentLockTime).format('YYYY-MM-DD HH:mm'));
    setHoverPrice(Number(fromDollaryDoos(currentPrice)));
  }, [currentPrice, currentLockTime]);

  const status = auction?.getStatus(currentBlocktime);

  if (status !== 'LISTED' && status !== 'STARTED' && status !== 'ENDED') {
    return <></>;
  }

  if (!auctionState || auctionState.spendingStatus) {
    return <></>;
  }

  const adjPrice = hoverPrice || Number(fromDollaryDoos(currentPrice));
  const adjLocktime = hoverLocktime || moment(currentLockTime).format('YYYY-MM-DD HH:mm');

  return (
    <Card className="auction-chart">
      <div className="auction-chart__header">
        <div className="auction-chart__header__data-group">
          <div className="auction-chart__header__data-group__label">
            Current Price
          </div>
          <div className="auction-chart__header__data-group__value">
            {`${fromDollaryDoos(currentPrice)} HNS`}
          </div>
        </div>
        <div className="auction-chart__header__data-group">
          <div className="auction-chart__header__data-group__label">
            Current Locktime
          </div>
          <div className="auction-chart__header__data-group__value">
            { currentLockTime > -1 ? moment(currentLockTime).format('YYYY-MM-DD HH:mm') : '-'}
          </div>
        </div>
        <div className="auction-chart__header__actions">
          <Button
            onClick={() => window.open(`bob://fulfillauction?name=${props.tld}&presign=${JSON.stringify(auctionState)}`, '_blank')}
          >
            <Icon url={BobLogo} size={1.25} />
            <span>Fulfill Auction</span>
          </Button>
        </div>
      </div>
      <LineChart
        width={chartWidth}
        height={chartHeight}
        margin={{
          top: 32,
          bottom: 32,
          left: chartWidth === 768 ? 96 : 32,
          right: chartWidth === 768 ? 96 : 32,
        }}
        data={data}
      >
        <XAxis
          dataKey="locktime"
          interval={0}
          ticks={[data[0].locktime, adjLocktime, data[data.length - 1].locktime]}
          domain={[data[0].locktime, data[data.length - 1].locktime]}
          tick={(opts: any) => renderXTicks(opts)}
        />
        <YAxis
          type="number"
          domain={[startPriceTick, endPriceTick]}
          ticks={[startPriceTick, adjPrice, endPriceTick]}
          interval={0}
          tick={(opts: any) => renderYTicks(opts)}
        />
        <Tooltip
          content={(opts: any) => renderTooltip({
            ...opts,
            setX,
            setY,
            setHoverPrice,
            setHoverLocktime,
          })}
          cursor={false}
        />
        <ReferenceLine
          x={adjLocktime}
          stroke="#FFFFFF"
          strokeDasharray="3 3"
          strokeOpacity={0.25}
        />
        <ReferenceLine
          y={adjPrice}
          stroke="#FFFFFF"
          strokeDasharray="3 3"
          strokeOpacity={0.25}
        />
        <Line
          type="step"
          dataKey="price"
          stroke="#ec4899"
        />
      </LineChart>
    </Card>
  )
}

const renderTooltip = (opts: {
  coordinate?: {
    x: number;
    y: number;
  };
  payload?: {
    payload: {
      locktime: string;
      price: number
    };
  }[];
  setX: (x: number) => null;
  setY: (y: number) => null;
  setHoverPrice: (hoverPrice: number) => null;
  setHoverLocktime: (hoverLocktime: string) => null;
}) => {
  const { x = 0, y = 0 } = opts.coordinate || {};
  const payloadList = opts.payload || [];
  const { price, locktime } = payloadList[0]?.payload || {};

  useEffect(() => {
    opts.setX(x);
    opts.setY(y);
    opts.setHoverPrice(price);
    opts.setHoverLocktime(locktime);
  }, [x, y, price, locktime]);

  return null;
};

const renderXTicks = (opts: {
  payload: {
    value: string;
  };
  index: number;
  x: number;
  y: number;
}) => {
  let anchor = 'start';

  if (opts.index === 2) {
    anchor = 'end';
  }

  if (opts.index === 1) {
    return (
      <foreignObject
        className="x-marker"
        x={opts.x - 80}
        y={opts.y}
        textAnchor="middle"
      >
        <div>
          {opts.payload.value}
        </div>
      </foreignObject>
    )
  }

  return (
    <g transform={`translate(0, 16)`}>
      <text
        x={opts.x}
        y={opts.y}
        textAnchor={anchor}
        fill="#666"
      >
        {opts.payload.value}
      </text>
    </g>
  );
};


const renderYTicks = (opts: {
  payload: {
    value: string;
  };
  index: number;
  x: number;
  y: number;
}) => {
  let anchor = 'end';

  const chartWidth = document.body.clientWidth < 768
    ? document.body.clientWidth
    : 768;

  if (opts.index === 1) {
    return (
      <foreignObject
        className="y-marker"
        x={chartWidth === 768 ? opts.x - 128 : opts.x - 64}
        y={opts.y - 16}
        textAnchor="middle"
      >
        <div>
          {opts.payload.value}
        </div>
      </foreignObject>
    )
  }

  return (
    <g transform={`translate(-8, 8)`}>
      <text
        x={opts.x}
        y={opts.y}
        textAnchor={anchor}
        fill="#666"
      >
        {opts.payload.value}
      </text>
    </g>
  );
};
