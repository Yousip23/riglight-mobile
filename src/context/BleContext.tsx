import React, { createContext, useContext } from 'react';
import { useBle } from '@/hooks/useBle';

type BleContextType = ReturnType<typeof useBle>;

const BleContext = createContext<BleContextType | null>(null);

export function BleProvider({ children }: { children: React.ReactNode }) {
  const ble = useBle();
  return <BleContext.Provider value={ble}>{children}</BleContext.Provider>;
}

export function useBleContext(): BleContextType {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBleContext must be used inside BleProvider');
  return ctx;
}
