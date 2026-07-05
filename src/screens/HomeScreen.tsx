import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, Modal, FlatList, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { ChassisView } from '@/components/ChassisView';
import { TireCard } from '@/components/TireCard';
import { useBleContext } from '@/context/BleContext';
import { BleDevice, TireConnection } from '@/hooks/useBle';

export interface TireSlot {
  id: string;
  label: string;
  deviceId: string | null;
  deviceName: string | null;
  ledsOn: boolean;
}

const DEFAULT_SLOTS: TireSlot[] = [
  { id: 'fl', label: 'FRONT L', deviceId: null, deviceName: null, ledsOn: false },
  { id: 'fr', label: 'FRONT R', deviceId: null, deviceName: null, ledsOn: false },
  { id: 'rl1', label: 'REAR L1', deviceId: null, deviceName: null, ledsOn: false },
  { id: 'rr1', label: 'REAR R1', deviceId: null, deviceName: null, ledsOn: false },
];

const STORAGE_KEY = 'riglight_slots_v2';

export function HomeScreen() {
  const [slots, setSlots] = useState<TireSlot[]>(DEFAULT_SLOTS);
  const [scanningFor, setScanningFor] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [scannedDevices, setScannedDevices] = useState<BleDevice[]>([]);
  const [allOn, setAllOn] = useState(false);

  const { connections, scanForDevices, connectDevice, disconnectDevice, sendCommand, sendToAll } = useBleContext();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const saved: TireSlot[] = JSON.parse(raw);
        setSlots(saved);
        saved.forEach(slot => {
          if (slot.deviceId) {
            connectDevice(slot.deviceId).catch(() => {});
          }
        });
      } catch {}
    });
  }, []);

  const persistSlots = useCallback((updated: TireSlot[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const handleTirePress = useCallback((slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    if (slot.deviceId && connections.has(slot.deviceId)) {
      const conn = connections.get(slot.deviceId)!;
      const asleep = conn.asleep;
      Alert.alert(
        slot.label,
        `${slot.deviceName ?? 'RigLight Device'}\nBattery: ${conn.batteryData?.level ?? '?'}%${conn.batteryData?.charging ? ' ⚡' : ''}\nStatus: ${asleep ? 'Sleeping 💤' : slot.ledsOn ? 'LEDs ON' : 'LEDs OFF'}`,
        [
          {
            text: slot.ledsOn ? 'Turn OFF' : 'Turn ON',
            onPress: () => handleToggle(slot),
          },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => handleDisconnect(slot),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else if (!slot.deviceId) {
      handleScan(slotId);
    }
  }, [slots, connections]);

  const handleScan = useCallback(async (slotId: string) => {
    setScanningFor(slotId);
    try {
      const devices = await scanForDevices();
      if (devices.length === 0) {
        Alert.alert('No Devices Found', 'Make sure your ESP32 is powered on and nearby.');
        return;
      }
      setScannedDevices(devices);
      setPendingSlotId(slotId);
      setModalVisible(true);
    } catch (e: any) {
      Alert.alert('Scan Error', e.message || 'Could not scan for devices.');
    } finally {
      setScanningFor(null);
    }
  }, [scanForDevices]);

  const handleSelectDevice = useCallback(async (device: BleDevice) => {
    setModalVisible(false);
    if (!pendingSlotId) return;
    try {
      await connectDevice(device.id);
      setSlots(prev => {
        const updated = prev.map(s =>
          s.id === pendingSlotId ? { ...s, deviceId: device.id, deviceName: device.name } : s
        );
        persistSlots(updated);
        return updated;
      });
    } catch (e: any) {
      Alert.alert('Connection Failed', e.message || 'Could not connect to device.');
    }
  }, [pendingSlotId, connectDevice, persistSlots]);

  const handleToggle = useCallback(async (slot: TireSlot) => {
    if (!slot.deviceId) return;
    const newState = !slot.ledsOn;
    setSlots(prev => {
      const updated = prev.map(s => s.id === slot.id ? { ...s, ledsOn: newState } : s);
      persistSlots(updated);
      return updated;
    });
    await sendCommand(slot.deviceId, newState ? 'ON' : 'OFF');
  }, [sendCommand, persistSlots]);

  const handleDisconnect = useCallback(async (slot: TireSlot) => {
    if (!slot.deviceId) return;
    await disconnectDevice(slot.deviceId);
    setSlots(prev => {
      const updated = prev.map(s =>
        s.id === slot.id ? { ...s, deviceId: null, deviceName: null, ledsOn: false } : s
      );
      persistSlots(updated);
      return updated;
    });
  }, [disconnectDevice, persistSlots]);

  const handleAllToggle = useCallback(async () => {
    const newState = !allOn;
    setAllOn(newState);
    setSlots(prev => {
      const updated = prev.map(s => ({ ...s, ledsOn: s.deviceId ? newState : s.ledsOn }));
      persistSlots(updated);
      return updated;
    });
    await sendToAll(newState ? 'ON' : 'OFF');
  }, [allOn, sendToAll, persistSlots]);

  const addAxle = () => {
    const rearCount = slots.filter(s => s.id.startsWith('r')).length;
    const axleNum = rearCount / 2 + 1;
    setSlots(prev => {
      const updated = [
        ...prev,
        { id: `rl${axleNum}`, label: `REAR L${axleNum}`, deviceId: null, deviceName: null, ledsOn: false },
        { id: `rr${axleNum}`, label: `REAR R${axleNum}`, deviceId: null, deviceName: null, ledsOn: false },
      ];
      persistSlots(updated);
      return updated;
    });
  };

  const connectedCount = slots.filter(s => s.deviceId && connections.has(s.deviceId)).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.appTitle}>RIGLIGHT</Text>
            <Text style={styles.appSub}>CHASSIS CONTROL SYSTEM</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.connCount}>{connectedCount}/{slots.length}</Text>
            <Text style={styles.connLabel}>CONNECTED</Text>
          </View>
        </View>

        {connectedCount > 0 && (
          <TouchableOpacity
            style={[styles.allBtn, allOn ? styles.allBtnOn : styles.allBtnOff]}
            onPress={handleAllToggle}
            testID="toggle-all"
          >
            <Text style={[styles.allBtnText, allOn ? styles.allBtnTextOn : styles.allBtnTextOff]}>
              {allOn ? '● ALL LIGHTS ON' : '○ ALL LIGHTS OFF'}
            </Text>
          </TouchableOpacity>
        )}

        <ChassisView
          slots={slots}
          connections={connections}
          scanningFor={scanningFor}
          onTirePress={handleTirePress}
          onAddAxle={addAxle}
        />

        <Text style={styles.tapHint}>TAP A TIRE TO CONNECT OR CONTROL IT</Text>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>SELECT DEVICE</Text>
            <Text style={styles.modalSub}>Choose the ESP32 for this tire position</Text>
            <FlatList
              data={scannedDevices}
              keyExtractor={d => d.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.deviceItem} onPress={() => handleSelectDevice(item)} testID={`device-${item.id}`}>
                  <View style={styles.deviceDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name ?? 'RigLight Device'}</Text>
                    <Text style={styles.deviceId} numberOfLines={1}>{item.id}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  appTitle: { color: Colors.cyan, fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  appSub: { color: Colors.textMuted, fontSize: 9, letterSpacing: 2, marginTop: 1 },
  headerRight: { alignItems: 'flex-end' },
  connCount: { color: Colors.amber, fontSize: 20, fontWeight: '900' },
  connLabel: { color: Colors.textMuted, fontSize: 8, letterSpacing: 1.5 },
  allBtn: { borderRadius: 6, paddingVertical: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  allBtnOn: { backgroundColor: Colors.cyanDim, borderColor: Colors.cyan },
  allBtnOff: { backgroundColor: Colors.surface, borderColor: Colors.border },
  allBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  allBtnTextOn: { color: Colors.cyan },
  allBtnTextOff: { color: Colors.textMuted },
  tapHint: {
    color: Colors.textMuted + '88',
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '65%' },
  modalTitle: { color: Colors.cyan, fontSize: 14, fontWeight: '900', letterSpacing: 3, marginBottom: 4, textAlign: 'center' },
  modalSub: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 16 },
  deviceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  deviceDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green, marginRight: 12 },
  deviceName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  deviceId: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  cancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: Colors.red, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
