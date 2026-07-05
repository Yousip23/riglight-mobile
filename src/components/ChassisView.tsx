import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import { TireConnection } from '@/hooks/useBle';

interface TireSlot {
  id: string;
  label: string;
  deviceId: string | null;
  deviceName: string | null;
  ledsOn: boolean;
}

interface ChassisViewProps {
  slots: TireSlot[];
  connections: Map<string, TireConnection>;
  scanningFor: string | null;
  onTirePress: (slotId: string) => void;
  onAddAxle: () => void;
}

const SCREEN_W = Dimensions.get('window').width;
const CHASSIS_W = Math.min(SCREEN_W - 32, 340);
const BODY_W = 80;
const TIRE_W = 22;
const TIRE_H = 36;
const BODY_X = (CHASSIS_W - BODY_W) / 2;
const TIRE_LEFT_X = BODY_X - TIRE_W - 8;
const TIRE_RIGHT_X = BODY_X + BODY_W + 8;
const FRONT_TIRE_Y = 28;
const FIRST_REAR_Y = 180;
const AXLE_GAP = 72;
const CAB_H = 60;

function getBatteryColor(level: number) {
  if (level > 50) return Colors.green;
  if (level > 20) return Colors.amber;
  return Colors.red;
}

interface TireNodeProps {
  slot: TireSlot;
  connection: TireConnection | null;
  scanning: boolean;
  onPress: () => void;
  x: number;
  y: number;
}

function TireNode({ slot, connection, scanning, onPress, x, y }: TireNodeProps) {
  const connected = !!connection;
  const ledsOn = slot.ledsOn;
  const asleep = connection?.asleep ?? false;
  const battery = connection?.batteryData;
  const glowColor = ledsOn ? Colors.cyan : asleep ? Colors.amber : connected ? Colors.green : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.tire,
        { left: x, top: y },
        connected && { borderColor: ledsOn ? Colors.cyan : asleep ? Colors.amber : Colors.green },
        ledsOn && {
          shadowColor: Colors.cyan,
          shadowOpacity: 0.9,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`tire-${slot.id}`}
    >
      {scanning ? (
        <ActivityIndicator color={Colors.cyan} size="small" />
      ) : (
        <>
          <View style={[styles.tireLed, { backgroundColor: ledsOn ? Colors.cyan : asleep ? Colors.amber : connected ? Colors.green : Colors.border }]} />
          {battery && (
            <Text style={[styles.tireBatt, { color: getBatteryColor(battery.level) }]}>
              {battery.level}%
            </Text>
          )}
          {!connected && (
            <Text style={styles.tirePlus}>+</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

export function ChassisView({ slots, connections, scanningFor, onTirePress, onAddAxle }: ChassisViewProps) {
  const frontSlots = slots.filter(s => s.id.startsWith('f'));
  const rearSlots = slots.filter(s => s.id.startsWith('r'));
  const axleCount = rearSlots.length / 2;
  const lastRearY = FIRST_REAR_Y + (axleCount - 1) * AXLE_GAP;
  const bodyTop = FRONT_TIRE_Y + TIRE_H / 2;
  const bodyBottom = lastRearY + TIRE_H / 2;
  const bodyH = bodyBottom - bodyTop;
  const chassisH = lastRearY + TIRE_H + 48;

  const rearPairs: Array<[TireSlot, TireSlot]> = [];
  for (let i = 0; i < rearSlots.length; i += 2) {
    rearPairs.push([rearSlots[i], rearSlots[i + 1]]);
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.chassis, { width: CHASSIS_W, height: chassisH }]}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <Text style={styles.labelFront}>FRONT</Text>
        <Text style={[styles.labelRear, { top: chassisH - 18 }]}>REAR</Text>

        {/* Cab */}
        <View style={[styles.cab, { left: BODY_X + 4, top: FRONT_TIRE_Y - 16, width: BODY_W - 8, height: CAB_H }]} />

        {/* Truck body */}
        <View style={[styles.body, { left: BODY_X, top: bodyTop, width: BODY_W, height: bodyH }]} />

        {/* Front axle bar */}
        <View style={[styles.axleBar, { top: FRONT_TIRE_Y + TIRE_H / 2 - 1, left: TIRE_LEFT_X + TIRE_W, width: BODY_X - (TIRE_LEFT_X + TIRE_W) }]} />
        <View style={[styles.axleBar, { top: FRONT_TIRE_Y + TIRE_H / 2 - 1, left: TIRE_RIGHT_X, width: BODY_X - (TIRE_LEFT_X + TIRE_W) }]} />
        <Text style={[styles.axleLabel, { top: FRONT_TIRE_Y + TIRE_H / 2 - 8 }]}>A1</Text>

        {/* Front tires */}
        {frontSlots[0] && (
          <TireNode
            slot={frontSlots[0]}
            connection={frontSlots[0].deviceId ? (connections.get(frontSlots[0].deviceId) ?? null) : null}
            scanning={scanningFor === frontSlots[0].id}
            onPress={() => onTirePress(frontSlots[0].id)}
            x={TIRE_LEFT_X}
            y={FRONT_TIRE_Y}
          />
        )}
        {frontSlots[1] && (
          <TireNode
            slot={frontSlots[1]}
            connection={frontSlots[1].deviceId ? (connections.get(frontSlots[1].deviceId) ?? null) : null}
            scanning={scanningFor === frontSlots[1].id}
            onPress={() => onTirePress(frontSlots[1].id)}
            x={TIRE_RIGHT_X}
            y={FRONT_TIRE_Y}
          />
        )}

        {/* Rear axles */}
        {rearPairs.map(([left, right], idx) => {
          const y = FIRST_REAR_Y + idx * AXLE_GAP;
          return (
            <React.Fragment key={idx}>
              <View style={[styles.axleBar, { top: y + TIRE_H / 2 - 1, left: TIRE_LEFT_X + TIRE_W, width: BODY_X - (TIRE_LEFT_X + TIRE_W) }]} />
              <View style={[styles.axleBar, { top: y + TIRE_H / 2 - 1, left: TIRE_RIGHT_X, width: BODY_X - (TIRE_LEFT_X + TIRE_W) }]} />
              <Text style={[styles.axleLabel, { top: y + TIRE_H / 2 - 8 }]}>A{idx + 2}</Text>
              <TireNode
                slot={left}
                connection={left.deviceId ? (connections.get(left.deviceId) ?? null) : null}
                scanning={scanningFor === left.id}
                onPress={() => onTirePress(left.id)}
                x={TIRE_LEFT_X}
                y={y}
              />
              <TireNode
                slot={right}
                connection={right.deviceId ? (connections.get(right.deviceId) ?? null) : null}
                scanning={scanningFor === right.id}
                onPress={() => onTirePress(right.id)}
                x={TIRE_RIGHT_X}
                y={y}
              />
            </React.Fragment>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addAxle} onPress={onAddAxle} testID="add-axle">
        <Text style={styles.addAxleText}>＋ ADD REAR AXLE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  chassis: {
    position: 'relative',
    backgroundColor: '#090d14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    zIndex: 20,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderColor: Colors.cyan + '99', borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderColor: Colors.cyan + '99', borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: Colors.cyan + '99', borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderColor: Colors.cyan + '99', borderBottomRightRadius: 4 },
  labelFront: {
    position: 'absolute', top: 6, alignSelf: 'center', left: 0, right: 0,
    textAlign: 'center', color: Colors.textMuted, fontSize: 8,
    letterSpacing: 3, fontWeight: '700',
  },
  labelRear: {
    position: 'absolute', alignSelf: 'center', left: 0, right: 0,
    textAlign: 'center', color: Colors.textMuted + '88', fontSize: 8,
    letterSpacing: 3, fontWeight: '700',
  },
  cab: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  body: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  axleBar: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.border,
  },
  axleLabel: {
    position: 'absolute',
    left: 0, right: 0,
    textAlign: 'center',
    color: Colors.cyan + '55',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tire: {
    position: 'absolute',
    width: TIRE_W,
    height: TIRE_H,
    backgroundColor: Colors.card,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tireLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tireBatt: {
    fontSize: 7,
    fontWeight: '800',
  },
  tirePlus: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '300',
  },
  addAxle: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  addAxleText: {
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
});
