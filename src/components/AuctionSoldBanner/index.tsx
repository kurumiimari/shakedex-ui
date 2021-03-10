import React, {useEffect, useState} from "react";
import {useAuctionByTLD} from "../../ducks/auctions";
import HandshakeEmoji from "../../../static/assets/icons/handshake.png";
import Icon from "../Icon";
import {useNodeClient} from "../../util/nodeclient";
import {fromDollaryDoos} from "../../util/number";
import {ellipsify} from "../../util/names";
import './auction-sold.scss';

type Props = {
  tld: string;
}

export default function AuctionSoldBanner(props: Props) {
  const auctionState = useAuctionByTLD(props.tld);
  const [buyer, setBuyer] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState(-1);
  const nodeClient = useNodeClient();

  useEffect(() => {
    (async () => {
      if (!auctionState) return;
      const {
        spendingTxHash,
        paymentAddr,
      } = auctionState || {};

      if (!spendingTxHash) return;
      const tx: any = await nodeClient.getTXByHash(spendingTxHash);

      if (tx.error) {
        return;
      }

      tx.outputs.forEach((output: {address: string; covenant: any; value: number}) => {
        if (output.address === paymentAddr && output.covenant.action === 'NONE') {
          setPurchaseAmount(output.value);
        }

        if (output.covenant.action === 'TRANSFER') {
          setBuyer(output.address);
        }
      })
    })()
  }, [auctionState?.spendingTxHash]);

  if (!auctionState || auctionState.spendingStatus !== "COMPLETED") {
    return <></>
  }

  return (
    <div className="auction-sold">
      <Icon url={HandshakeEmoji} size={2.25} />
      <a
        className="auction-sold__text"
        href={`https://hnsnetwork.com/txs/${auctionState?.spendingTxHash}`}
        target="_blank"
      >
        {`Sold at ${fromDollaryDoos(purchaseAmount)} HNS to ${ellipsify(buyer, 6, 6)}`}
      </a>
    </div>
  )
}
