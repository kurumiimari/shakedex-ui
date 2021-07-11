import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchStats, State} from '../../ducks/stats';
import AppContent from '../../components/AppContent';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import moment from 'moment';
import {formatNumber, fromDollaryDoos} from '../../util/number';
import {Loader} from '../../components/Loader';

const PADDING_FACTOR = 32;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const Stats = () => {
  const dispatch = useDispatch();
  const {loading, stats} = useSelector((state: { stats: State }) => state.stats);

  useEffect(() => {
    if (!stats) {
      dispatch(fetchStats());
    }
  }, [stats]);

  return (
    <AppContent className="pb-4">
      <div className="flex bg-gray-700 p-4 items-center mb-4 mt-4">
        <h1 className="text-xl font-bold col-span-4 mr-auto">Stats</h1>
      </div>
      {loading && (
        <div className="flex justify-center bg-gray-700 p-4">
          <Loader />
        </div>
      )}
      {stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard title="Total Auctions" value={stats.totalAuctions} />
            <StatCard title="Active Auctions" value={stats.totalAuctions - stats.totalCompletes - stats.totalCancellations} />
            <StatCard title="Complete Auctions" value={stats.totalCompletes} />
            <StatCard title="Cancelled Auctions" value={stats.totalCancellations} />
          </div>
          <div className="mb-4">
            <h2 className="text-sm bg-gray-800 py-2 px-4">
              Total Volume By Month
            </h2>
            <div className="bg-gray-700 p-4">
              <ResponsiveContainer width="100%" height={460}>
                <BarChart
                  data={stats.monthlyVolume.map(d => ({
                    month: MONTHS[d.month],
                    volume: fromDollaryDoos(d.volume, 2)
                  }))}
                >
                  <XAxis dataKey="month" tickLine={false} tickCount={3} />
                  <YAxis width={80} tickCount={5} axisLine={false} tickLine={false} unit="HNS" />
                  <Tooltip content={<VolumeTooltip />} />
                  <Bar dataKey="volume" fill="#e71a7f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h2 className="text-sm bg-gray-800 py-2 px-4">
              New Auctions Per Day
            </h2>
            <div className="bg-gray-700 p-4">
              <ResponsiveContainer width="100%" height={460}>
                <BarChart
                  data={stats.auctionCountByDay.map(d => ({
                    date: moment(d.date).format('MM/DD/YYYY'),
                    count: d.count
                  }))}
                >
                  <XAxis dataKey="date" tickLine={false} tickCount={3} />
                  <YAxis width={30} tickCount={5} axisLine={false} tickLine={false} />
                  <Tooltip content={<AuctionTooltip />} />
                  <Bar dataKey="count" fill="#e71a7f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppContent>
  );
};

const VolumeTooltip = (props: any) => {
  const {active, payload, label} = props;
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-gray-600 rounded-sm p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-sm text-pink-500">{formatNumber(payload[0].value)} HNS</p>
    </div>
  );
};

const AuctionTooltip = (props: any) => {
  const {active, payload, label} = props;
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-gray-600 rounded-sm p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-sm text-gray-400">Count: <span className="text-pink-500">{payload[0].value}</span></p>
    </div>
  );
};

const StatCard = (props: { title: string, value: number }) => {
  return (
    <div className="rounded-sm">
      <h2 className="text-sm bg-gray-800 py-2 px-4">{props.title}</h2>
      <div className="bg-gray-700 text-3xl font-bold p-4 text-center">
        {props.value}
      </div>
    </div>
  );
};

export default Stats;