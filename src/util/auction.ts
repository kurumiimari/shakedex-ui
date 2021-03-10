import {AuctionState, ProposalState} from "../ducks/auctions";
import moment from "moment";
import {fromDollaryDoos} from "./number";

type AuctionStatus = 'LISTED' | 'STARTED' | 'ENDED' | 'COMPLETED' | 'CANCELLED';

export class Auction {
  tld: string;

  durationDays: number;

  endPrice: number;

  startPrice: number;

  startTime: Date;

  endTime: Date;

  proposals: ProposalState[];

  priceDecrement: number;

  decrementUnit: '1d' | '3h' | '1h' | '';

  status: 'COMPLETED' | 'CANCELLED' | null;

  buyer: string | null;

  constructor(options: AuctionState | undefined | null) {
    this.tld = options?.name || '';
    this.startPrice = options?.data[0].price || -1;
    this.endPrice = options?.data[options?.data.length - 1].price || -1;
    this.proposals = options?.data || [];
    this.startTime = String(this.proposals[0]?.lockTime).length === 10
      ? new Date(this.proposals[0]?.lockTime * 1000)
      : new Date(this.proposals[0]?.lockTime);
    const endTime = this.proposals[this.proposals.length - 1]?.lockTime;
    this.endTime = String(endTime).length === 10
      ? new Date(endTime * 1000)
      : new Date(endTime);
    this.priceDecrement = Math.abs(this.proposals[1]?.price - this.startPrice);
    this.durationDays = moment(this.endTime).diff(moment(this.startTime), 'd') + 1;
    this.status = options?.spendingStatus || null;
    this.buyer = options?.spendingTxHash || null;

    const secondTime = String(this.proposals[1]?.lockTime).length === 10
      ? new Date(this.proposals[1]?.lockTime * 1000)
      : new Date(this.proposals[1]?.lockTime);

    switch ((secondTime.getTime() - this.startTime.getTime()) / 3600000) {
      case 24:
        this.decrementUnit = '1d';
        break;
      case 3:
        this.decrementUnit = '3h';
        break;
      case 1:
        this.decrementUnit = '1h';
        break;
      default:
        this.decrementUnit = '';
        break;
    }
  }

  getStatus(blockTime: Date): AuctionStatus {
    const startTime = moment(this.startTime);
    const endTime = moment(this.endTime);
    const currentTime = moment(blockTime);

    if (this.status) return this.status;

    if (currentTime.isBefore(startTime)) {
      return 'LISTED';
    } else if (currentTime.isSameOrAfter(startTime) && currentTime.isSameOrBefore(endTime)) {
      return 'STARTED';
    } else {
      return 'ENDED';
    }
  }

  getStatusText(blocktime: Date) {
    const status = this.getStatus(blocktime);

    switch (status) {
      case "COMPLETED":
        return `SOLD`;
      case "CANCELLED":
        return 'Cancelled';
      case "LISTED":
        return `Start ${moment(this.startTime).fromNow()}`;
      case "STARTED":
        return `End ${moment(this.endTime).fromNow()}`;
      case "ENDED":
        return 'Finished';
    }
  }

  getCurrentPrice(blocktime: Date): number {
    if (this.getStatus(blocktime) === 'LISTED') return this.startPrice;
    if (this.getStatus(blocktime) === 'ENDED') return this.endPrice;

    let price = this.proposals[0]?.price;
    const currentTime = moment(blocktime);

    for (const proposal of this.proposals) {
      const proposalTime = String(proposal.lockTime).length === 10
        ? moment(proposal.lockTime * 1000)
        : moment(proposal.lockTime);
      if (currentTime.isSameOrAfter(proposalTime)) {
        price = proposal.price;
      }
    }

    return price;
  }

  getCurrentTime(blocktime: Date): number {
    if (this.getStatus(blocktime) !== 'STARTED') return -1;

    let locktime = this.proposals[0]?.lockTime;
    const currentTime = moment(blocktime);

    for (const proposal of this.proposals) {
      const proposalTime = String(proposal.lockTime).length === 10
        ? moment(proposal.lockTime * 1000)
        : moment(proposal.lockTime);
      if (currentTime.isSameOrAfter(proposalTime)) {
        locktime = proposal.lockTime;
      }
    }

    return locktime;
  }

  getChartData(): {price: number; locktime: string; name: string}[] {
    return this.proposals.map(proposal => ({
      price: Number(fromDollaryDoos(proposal.price)),
      locktime: String(proposal.lockTime).length === 10
          ? moment(proposal.lockTime * 1000).format('YYYY-MM-DD HH:mm')
          : moment(proposal.lockTime).format('YYYY-MM-DD HH:mm'),
      name: name,
    }));
  }
}
