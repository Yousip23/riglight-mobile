import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { TireConnection } from '@/hooks/useBle';

interface Props {
  label: string;
  connection: TireConnection | null;
  ledsOn: boolean;
  onToggle: () => void;
  onScan: () => void;
  onDisconnect: () => void;
  scanning?: boolean;
}

export function TireCard({ label, connection, ledsOn, onToggle, onScan, onDisconnect, scanning }: Props) {
  const battery = connection?.batteryData;
  const connected = !!connection;
  const asleep = connection?.asleep ?? false;

  const getBatteryColor = (level: number) => {
    if (level > 50) return Colors.green;
    if (level > 20) return Colors.amber;
    return Colors.red;
  };

  return (
    <View style={[styles.card, connected && styles.cardConnected]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.statusDot, { backgroundColor: asleep ? Colors.amber : connected ? Colors.green : Colors.textMuted }]} />
      </View>

      {connected ? (
        <>
          <Text style={styles.deviceName} numberOfLines={1}>
            {connection!.device.name ?? 'RigLight Device'}
          </Text>

          {battery ? (
            <View style={styles.batteryRow}>
              <View style={styles.batteryOuter}>
                <View style={[styles.batteryFill, {
                  width: `${battery.level}%` as any,
                  backgroundColor: getBatteryColor(battery.level)
                }]} />
              </View>
              <Text style={[styles.batteryText, { color: getBatteryColor(battery.level) }]}>
                {battery.level}%{battery.charging ? ' ⚡' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.waitingText}>Waiting for data...</Text>
          )}

          {asleep ? (
            <Text style={styles.sleepText}>💤 SLEEPING</Text>
          ) : (
            <TouchableOpacity
              style={[styles.toggleBtn, ledsOn ? styles.toggleOn : styles.toggleOff]}
              onPress={onToggle}
              testID={`toggle-${label}`}
            >
              <Text style={[styles.toggleText, ledsOn ? styles.toggleTextOn : styles.toggleTextOff]}>
                {ledsOn ? '● ON' : '○ OFF'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnect}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.scanBtn} onPress={onScan} disabled={scanning} testID={`scan-${label}`}>
          {scanning ? (
            <ActivityIndicator color={Colors.cyan} size="small" />
          ) : (
            <Text style={styles.scanText}>＋ Connect</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    flex: 1,
    margin: 4,
    minHeight: 140,
  },
  cardConnected: {
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  batteryOuter: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 40,
  },
  waitingText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  sleepText: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
  },
  toggleBtn: {
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  toggleOn: {
    backgroundColor: Colors.cyanDim,
    borderColor: Colors.cyan,
  },
  toggleOff: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  toggleTextOn: {
    color: Colors.cyan,
  },
  toggleTextOff: {
    color: Colors.textMuted,
  },
  scanBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderStyle: 'dashed',
    minHeight: 60,
  },
  scanText: {
    color: Colors.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  disconnectText: {
    color: Colors.red,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
