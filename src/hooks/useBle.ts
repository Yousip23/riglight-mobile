export interface BleDevice {
  id: string;
  name: string | null;
}

export interface BatteryData {
  level: number;
  charging: boolean;
  rate: number;
}

export interface MotionData {
  active: boolean;
  secondsLeft: number;
}

export interface TireConnection {
  device: any;
  batteryData: BatteryData | null;
  motionData: MotionData | null;
  asleep: boolean;
}

export function useBle() {
  return {
    scanning: false,
    foundDevices: [] as BleDevice[],
    connections: new Map<string, TireConnection>(),
    scanForDevices: async (): Promise<BleDevice[]> => { throw new Error('Bluetooth not available on web'); },
    connectDevice: async (_id: string) => {},
    disconnectDevice: async (_id: string) => {},
    sendCommand: async (_id: string, _cmd: string) => {},
    sendToAll: async (_cmd: string) => {},
  };
}
