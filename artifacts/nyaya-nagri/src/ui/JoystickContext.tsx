import React, { createContext, useContext, useRef } from 'react';

export interface JoystickData {
  x: number;
  y: number;
  active: boolean;
}

const JoystickContext = createContext<React.MutableRefObject<JoystickData> | null>(null);

export function JoystickProvider({ children }: { children: React.ReactNode }) {
  const joystickRef = useRef<JoystickData>({ x: 0, y: 0, active: false });
  
  return (
    <JoystickContext.Provider value={joystickRef}>
      {children}
    </JoystickContext.Provider>
  );
}

export function useJoystick() {
  const context = useContext(JoystickContext);
  if (!context) throw new Error("useJoystick must be used within JoystickProvider");
  return context;
}
