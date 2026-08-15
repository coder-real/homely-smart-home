import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from './src/theme';
import TopBar from './src/components/TopBar';
import House3D from './src/components/House3D';
import SensorCards from './src/components/SensorCards';
import DeviceControls from './src/components/DeviceControls';
import ActivityLog from './src/components/ActivityLog';
import { useSimulation } from './src/hooks/useSimulation';
import { useHomeStore } from './src/store/useHomeStore';

function StatusBarBottom() {
  const motionDetected = useHomeStore((s) => s.motionDetected);
  const rooms = useHomeStore((s) => s.rooms);
  const anyOn = Object.values(rooms).some((r) => r.isOn);

  return (
    <View style={styles.statusBarBottom}>
      <StatusItem label="Wi-Fi" active />
      <StatusItem label={motionDetected ? 'Motion' : 'No Motion'} active={motionDetected} />
      <StatusItem label={anyOn ? 'Devices On' : 'All Off'} active={anyOn} />
    </View>
  );
}

function StatusItem({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, active && styles.statusDotActive]} />
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

export default function App() {
  // Run simulation for demo (remove when connecting real ESP32)
  useSimulation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top Bar */}
      <TopBar />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3D House */}
        <View style={styles.houseSection}>
          <House3D />
          <StatusBarBottom />
        </View>

        {/* Sensors */}
        <SensorCards />

        {/* Device Controls */}
        <DeviceControls />

        {/* Activity Log */}
        <ActivityLog />

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  houseSection: {
    position: 'relative',
  },
  statusBarBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusDotActive: {
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusLabel: {
    color: colors.textDim,
    fontSize: fontSize.xs,
  },
});
