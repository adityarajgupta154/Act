import React from 'react';
import { Scene } from '@/world/Scene';
import { HUD } from '@/ui/HUD';
import { JoystickProvider } from '@/ui/JoystickContext';

export default function HomePage() {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-sky-100 touch-none">
      <JoystickProvider>
        {/* 3D World Layer */}
        <div className="absolute inset-0 z-0">
          <Scene />
        </div>
        
        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <HUD />
        </div>
      </JoystickProvider>
    </div>
  );
}
