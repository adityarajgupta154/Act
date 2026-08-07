import React, { useRef, useEffect, useState } from 'react';
import { useJoystick } from './JoystickContext';
import { HelpDialog } from './HelpDialog';
import { Settings, Map as MapIcon } from 'lucide-react';
import { useUIStore, playerPosition, enterZone, exitZone } from './uiStore';
import { getZoneStates, getZone } from '@/world/zones';
import { progressStore } from '@/data/progressStore';

function Minimap() {
  const playerRef = useRef<HTMLDivElement>(null);
  const [states, setStates] = useState(getZoneStates());
  
  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      if (playerRef.current) {
        // Map space -40..40 roughly into 0..100%
        const px = Math.min(Math.max(((playerPosition.x + 40) / 80) * 100, 0), 100);
        const pz = Math.min(Math.max(((playerPosition.z + 40) / 80) * 100, 0), 100);
        playerRef.current.style.left = `${px}%`;
        playerRef.current.style.top = `${pz}%`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="w-24 h-24 md:w-32 md:h-32 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden pointer-events-auto flex-shrink-0">
      {states.map(z => {
        const px = ((z.position[0] + 40) / 80) * 100;
        const pz = ((z.position[1] + 40) / 80) * 100;
        return (
          <div
            key={z.id}
            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 ${z.unlocked ? 'bg-orange-400 border-white' : 'bg-slate-300 border-slate-100'}`}
            style={{ left: `${px}%`, top: `${pz}%` }}
          />
        );
      })}
      <div
        ref={playerRef}
        className="absolute w-4 h-4 -ml-2 -mt-2 bg-sky-500 rounded-full border-2 border-white shadow-sm z-10 transition-transform duration-75"
      />
    </div>
  );
}

function ProximityPrompt() {
  const { nearbyZoneId } = useUIStore();
  const [states, setStates] = useState(getZoneStates());
  
  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  if (!nearbyZoneId) return null;

  const zoneState = states.find(z => z.id === nearbyZoneId);
  if (!zoneState) return null;

  if (zoneState.unlocked) {
    return (
      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-orange-100 flex flex-col items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <h3 className="font-display font-bold text-xl text-orange-500">{zoneState.name}</h3>
        <button
          onClick={() => enterZone(nearbyZoneId)}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 touch-manipulation"
        >
          Press E or Tap to Enter
        </button>
      </div>
    );
  }

  const previous = states.find(z => z.order === zoneState.order - 1);
  return (
    <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center gap-2 pointer-events-auto opacity-90 animate-in slide-in-from-bottom-4 duration-200">
      <h3 className="font-display font-bold text-xl text-slate-500">{zoneState.name}</h3>
      <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
        Locked
      </div>
      {previous && (
        <p className="text-sm font-medium text-slate-500">
          Complete "{previous.name}" first
        </p>
      )}
    </div>
  );
}

function ZoneInterior({ zoneId }: { zoneId: string }) {
  const zone = getZone(zoneId);
  if (!zone) return null;

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300">
      <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
        <MapIcon className="w-8 h-8 text-orange-500" />
      </div>
      <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-4">{zone.name}</h2>
      <p className="text-lg md:text-xl text-slate-600 mb-10 font-medium">{zone.theme}</p>
      <button
        onClick={exitZone}
        className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md flex items-center gap-2 mx-auto touch-manipulation"
      >
        Back to Map
      </button>
    </div>
  );
}

export function HUD() {
  const { activeZoneId, fadeOpacity } = useUIStore();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      
      {/* Normal HUD / Map View Elements */}
      {!activeZoneId && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex justify-between items-start w-full z-10">
            <div className="bg-white/90 backdrop-blur-sm px-5 py-3 md:px-6 md:py-3 rounded-2xl shadow-sm border border-orange-100 pointer-events-auto">
              <h1 className="font-display font-bold text-xl md:text-2xl text-orange-500 tracking-wide">
                Nyaya Nagri
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 pointer-events-auto">
              <button 
                className="bg-white/90 backdrop-blur-sm p-3 md:p-4 rounded-full shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
                aria-label="Settings"
              >
                <Settings className="w-6 h-6 text-slate-500" />
              </button>
              <Minimap />
            </div>
          </div>

          {/* Bottom Center Prompt */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-max max-w-[90vw]">
            <ProximityPrompt />
          </div>

          {/* Bottom Left Joystick */}
          <div className="flex justify-start items-end w-full z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 pointer-events-auto shrink-0 mb-2 md:mb-4">
              <JoystickUI />
            </div>
          </div>
        </div>
      )}

      {/* Interior View Overlay */}
      {activeZoneId && (
        <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-50/95 backdrop-blur-md flex items-center justify-center p-6">
          <ZoneInterior zoneId={activeZoneId} />
        </div>
      )}

      {/* Black Fade Overlay (z-40) */}
      <div
        className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-300 ease-in-out z-40"
        style={{ opacity: fadeOpacity }}
      />

      {/* Help Button (z-50) - Always visible, never fades */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 pointer-events-auto">
        <HelpDialog />
      </div>
    </div>
  );
}

function JoystickUI() {
  const joystickRef = useJoystick();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!baseRef.current || !knobRef.current) return;
    baseRef.current.setPointerCapture(e.pointerId);
    joystickRef.current.active = true;
    updatePosition(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!joystickRef.current.active) return;
    updatePosition(e);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!baseRef.current) return;
    baseRef.current.releasePointerCapture(e.pointerId);
    joystickRef.current.active = false;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };
  
  const updatePosition = (e: React.PointerEvent) => {
    if (!baseRef.current || !knobRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    const maxDistance = rect.width / 2 - 24; 
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    
    joystickRef.current.x = dx / maxDistance;
    joystickRef.current.y = dy / maxDistance;
  };
  
  return (
    <div 
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="w-full h-full bg-white/30 backdrop-blur-md rounded-full border-[3px] border-white/50 flex items-center justify-center touch-none shadow-sm"
    >
      <div 
        ref={knobRef}
        className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-lg border border-slate-100/50 transition-transform duration-75 ease-out"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
