import React from 'react';
import AppContent from '../../components/AppContent';
import SystemMessage from '../../components/SystemMessage';
import './maintenance-view.scss';


export default function MaintenanceView() {
  return (
    <AppContent className="maintenance-view">
      <SystemMessage>
        <p>
          Shakedex is currently down for maintenance.<br />
          We'll be back up in a few days.
        </p>
        <br />
        <p>
          <strong>Note: </strong>
          All auctions will have to be reposted as they are not compatible
          with the next version of the software.
        </p>
      </SystemMessage>
    </AppContent>
  );
}