import React from "react";
import c from "classnames";
import copy from "copy-to-clipboard";

import Tooltipable from "../Tooltipable";
import Icon from "../Icon";
import Card from "../Card";

import "./auction-overview.scss";
import {useAuctionByTLD} from "../../ducks/auctions";
import TLD from '../TLD';
import {SHAKEDEX_URL} from '../../util/shakedex';

type Props = {
  tld: string;
}

export default function AuctionOverview(props: Props) {
  const {
    tld,
  } = props;

  const auctionJSON = useAuctionByTLD(tld);

  const bookmarked = false;

  return (
    <Card className="auction-overview">
      <div className="auction-overview__l">
        <Tooltipable text="Bookmark">
          {/*<Icon*/}
          {/*  className={c("auction-overview__fav-icon", {*/}
          {/*    'auction-overview__fav-icon--bookmarked': bookmarked,*/}
          {/*  })}*/}
          {/*  material={bookmarked ? 'favorite' : 'favorite_border'}*/}
          {/*  size={2.25}*/}
          {/*  onClick={() => null}*/}
          {/*/>*/}
        </Tooltipable>
        <div className="auction-overview__name">
          <TLD tld={tld} />
        </div>
      </div>
      <div className="auction-overview__r">
        {
          auctionJSON && (
            <Tooltipable text="Download Presign">
              <a href={`${SHAKEDEX_URL}/api/v1/auctions/${auctionJSON.id}/download`} target="_blank">
                <Icon
                  material="download"
                  size={2.25}
                />
              </a>
            </Tooltipable>
          )
        }
        <Tooltipable text="Copy URL">
          <Icon
            material="link"
            size={2.25}
            onClick={() => copy(window.location.href)}
          />
        </Tooltipable>
      </div>
    </Card>
  );
}

function download(filename: string, text: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
