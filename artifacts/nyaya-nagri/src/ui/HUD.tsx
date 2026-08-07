import React, { useRef } from 'react';
import { useJoystick } from './JoystickContext';
import { HelpDialog } from './HelpDialog';
import { Settings } from 'lucide-react';

export function HUD() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full z-10">
        <div className="bg-white/90 backdrop-blur-sm px-5 py-3 md:px-6 md:py-3 rounded-2xl shadow-sm border border-orange-100 pointer-events-auto">
          <h1 className="font-display font-bold text-xl md:text-2xl text-orange-500 tracking-wide">
            Nyaya Nagri
          </h1>
        </div>
        
        <button 
          className="bg-white/90 backdrop-blur-sm p-3 md:p-4 rounded-full shadow-sm border border-slate-100 pointer-events-auto hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-slate-500" />
        </button>
      </div>
      
      {/* Bottom Area */}
      <div className="flex justify-between items-end w-full pb-2 md:pb-4 z-10">
        {/* Joystick Zone (Left) */}
        <div className="w-32 h-32 md:w-40 md:h-40 pointer-events-auto shrink-0">
          <JoystickUI />
        </div>
        
        {/* Help Button (Right) */}
        <div className="pointer-events-auto shrink-0 mb-4 mr-2 md:mb-6 md:mr-4">
          <HelpDialog />
        </div>
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
    
    // Calculate max travel distance for the knob
    const maxDistance = rect.width / 2 - 24; // 24 is roughly knob radius + padding
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // Normalize to -1 to 1 for the game loop
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
