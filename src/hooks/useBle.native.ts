import { useState, useCallback, useRef } from 'react';
import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

function b64ToUtf8(b64: string): string {
  try { return atob(b64); } catch { return ''; }
}

function utf8ToB64(str: string): string {
  try { return btoa(str); } catch { return btoa(unescape(encodeURIComponent(str))); }
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

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
  device: Device;
  batteryData: BatteryData | null;
  motionData: MotionData | null;
  asleep: boolean;
}

const manager = new BleManager();

export function useBle() {
  const [scanning, setScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<BleDevice[]>([]);
  const connectionsRef = useRef<Map<string, TireConnection>>(new Map());
  const [connections, setConnections] = useState<Map<string, TireConnection>>(new Map());

  const updateConnections = () => {
    setConnections(new Map(connectionsRef.current));
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
    }
    return true;
  };

  const scanForDevices = useCallback(async (): Promise<BleDevice[]> => {
    const ok = await requestPermissions();
    if (!ok) throw new Error('Bluetooth permissions denied');

    return new Promise((resolve, reject) => {
      const found: Map<string, BleDevice> = new Map();
      setFoundDevices([]);
      setScanning(true);

      manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (error: BleError | null, device: Device | null) => {
          if (error) {
            setScanning(false);
            manager.stopDeviceScan();
            reject(error);
            return;
          }
          if (device && !found.has(device.id)) {
            const d: BleDevice = { id: device.id, name: device.name };
            found.set(device.id, d);
            setFoundDevices(Array.from(found.values()));
          }
        }
      );

      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
        resolve(Array.from(found.values()));
      }, 7000);
    });
  }, []);

  const connectDevice = useCallback(async (deviceId: string): Promise<void> => {
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    const conn: TireConnection = {
      device,
      batteryData: null,
      motionData: null,
      asleep: false,
    };
    connectionsRef.current.set(deviceId, conn);
    updateConnections();

    device.monitorCharacteristicForService(
      SERVICE_UUID,
      TX_CHAR_UUID,
      (error: BleError | null, char: Characteristic | null) => {
        if (error || !char?.value) return;
        const decoded = b64ToUtf8(char.value).trim();
        const existing = connectionsRef.current.get(deviceId);
        if (!existing) return;

        if (decoded.startsWith('B:')) {
          const parts = decoded.split(':');
          existing.batteryData = {
            level: parseInt(parts[1]) || 0,
            charging: parts[2] === '1',
            rate: parseInt(parts[3]) || 0,
          };
          existing.asleep = false;
        } else if (decoded.startsWith('M:')) {
          const parts = decoded.split(':');
          existing.motionData = {
            active: parts[1] === '1',
            secondsLeft: parseInt(parts[2]) || 0,
          };
          existing.asleep = false;
        } else if (decoded === 'S:SLEEP') {
          existing.asleep = true;
        }
        connectionsRef.current.set(deviceId, { ...existing });
        updateConnections();
      }
    );

    device.onDisconnected(() => {
      connectionsRef.current.delete(deviceId);
      updateConnections();
    });
  }, []);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    const conn = connectionsRef.current.get(deviceId);
    if (conn) {
      await conn.device.cancelConnection();
      connectionsRef.current.delete(deviceId);
      updateConnections();
    }
  }, []);

  const sendCommand = useCallback(async (deviceId: string, command: string) => {
    const conn = connectionsRef.current.get(deviceId);
    if (!conn) return;
    const encoded = utf8ToB64(command);
    await conn.device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      RX_CHAR_UUID,
      encoded
    );
  }, []);

  const sendToAll = useCallback(async (command: string) => {
    for (const [id] of connectionsRef.current) {
      await sendCommand(id, command);
    }
  }, [sendCommand]);

  return {
    scanning,
    foundDevices,
    connections,
    scanForDevices,
    connectDevice,
    disconnectDevice,
    sendCommand,
    sendToAll,
  };
}
