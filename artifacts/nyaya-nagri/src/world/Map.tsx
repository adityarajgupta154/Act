/**
 * Nyaya Nagri — world map: environment scenery + the seven zone landmarks.
 * Zone identity/order/lock state all come from zones.ts via getZoneStates();
 * this component only decides what those states LOOK like.
 */
import React from 'react';
import { getZoneStates } from './zones';
import { progressStore } from '@/data/progressStore';
import { WorldEnvironment } from './environment';
import {
  MarkerZone0,
  MarkerZone1,
  MarkerZone2,
  MarkerZone3,
  MarkerZone4,
  MarkerZone5,
  MarkerZone6,
} from './markers';

// Hook to get zone states without spamming renders
function useZoneStatesLive() {
  const [states, setStates] = React.useState(getZoneStates());
  React.useEffect(() => {
    return progressStore.subscribe(() => {
      setStates(getZoneStates());
    });
  }, []);
  return states;
}

export function Map() {
  const states = useZoneStatesLive();

  return (
    <group>
      <WorldEnvironment />

      {/* Zone Markers */}
      {states.map((zone) => {
        const props = { position: zone.position, unlocked: zone.unlocked };
        switch (zone.id) {
          case 'zone0': return <MarkerZone0 key={zone.id} {...props} />;
          case 'zone1': return <MarkerZone1 key={zone.id} {...props} />;
          case 'zone2': return <MarkerZone2 key={zone.id} {...props} />;
          case 'zone3': return <MarkerZone3 key={zone.id} {...props} />;
          case 'zone4': return <MarkerZone4 key={zone.id} {...props} />;
          case 'zone5': return <MarkerZone5 key={zone.id} {...props} />;
          case 'zone6': return <MarkerZone6 key={zone.id} {...props} />;
          default: return null;
        }
      })}
    </group>
  );
}
