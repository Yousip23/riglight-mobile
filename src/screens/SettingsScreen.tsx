import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '@/constants/colors';
import { useBleContext } from '@/context/BleContext';

export function SettingsScreen() {
  const [minutes, setMinutes] = useState(60);
  const { sendToAll } = useBleContext();

  const apply = async () => {
    const cmd = `T:${Math.round(minutes)}`;
    await sendToAll(cmd);
    Alert.alert('Timer Set', `Auto-sleep timer set to ${Math.round(minutes)} min on all connected wheels.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>SETTINGS</Text>
        <Text style={styles.sub}>AUTO-SLEEP TIMER</Text>
        <Text style={styles.desc}>
          Wheels automatically shut off LEDs and enter low-power sleep after this many minutes of no wheel movement.
        </Text>

        <View style={styles.valueBox}>
          <Text style={styles.valueNum}>{Math.round(minutes)}</Text>
          <Text style={styles.valueUnit}>MINUTES</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>1</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={480}
            step={1}
            value={minutes}
            onValueChange={setMinutes}
            minimumTrackTintColor={Colors.cyan}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.cyan}
            testID="timer-slider"
          />
          <Text style={styles.sliderLabel}>480</Text>
        </View>

        <View style={styles.presets}>
          {[15, 30, 60, 120, 240].map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.preset, Math.round(minutes) === m && styles.presetActive]}
              onPress={() => setMinutes(m)}
              testID={`preset-${m}`}
            >
              <Text style={[styles.presetText, Math.round(minutes) === m && styles.presetTextActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={apply} testID="apply-timer">
          <Text style={styles.applyText}>APPLY TO ALL WHEELS</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>HOW AUTO-SLEEP WORKS</Text>
          <Text style={styles.infoText}>
            1. Wheel spins → reed switch pulses → timer resets{'\n'}
            2. Wheel stops → timer counts down{'\n'}
            3. Timer hits 0 → LEDs OFF, board sleeps (~0.01mA){'\n'}
            4. Wheel spins again → board wakes up automatically
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  title: {
    color: Colors.cyan, fontSize: 20, fontWeight: '900',
    letterSpacing: 4, marginBottom: 20,
  },
  sub: {
    color: Colors.textMuted, fontSize: 10, letterSpacing: 2,
    fontWeight: '700', marginBottom: 8,
  },
  desc: { color: Colors.text, fontSize: 13, lineHeight: 20, marginBottom: 24 },
  valueBox: {
    alignItems: 'center', marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.cyan,
    paddingVertical: 16,
  },
  valueNum: {
    color: Colors.cyan, fontSize: 52, fontWeight: '900', lineHeight: 56,
  },
  valueUnit: {
    color: Colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  slider: { flex: 1, height: 40 },
  sliderLabel: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700', width: 28, textAlign: 'center',
  },
  presets: {
    flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center',
  },
  preset: {
    backgroundColor: Colors.card, borderRadius: 6,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  presetActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyanDim },
  presetText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  presetTextActive: { color: Colors.cyan },
  applyBtn: {
    backgroundColor: Colors.amber, borderRadius: 6,
    paddingVertical: 14, alignItems: 'center', marginBottom: 24,
  },
  applyText: { color: Colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  infoBox: {
    backgroundColor: Colors.card, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  infoTitle: {
    color: Colors.amber, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 10,
  },
  infoText: { color: Colors.textMuted, fontSize: 12, lineHeight: 20 },
});
