import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from './src/theme';
import TopBar from './src/components/TopBar';
import SensorCards from './src/components/SensorCards';
import DeviceControls from './src/components/DeviceControls';
import ActivityLog from './src/components/ActivityLog';
import { useSimulation } from './src/hooks/useSimulation';
import { useHomeStore } from './src/store/useHomeStore';

function QuickStatus() {
  const motionDetected = useHomeStore((s) => s.motionDetected);
  const rooms = useHomeStore((s) => s.rooms);
  const mode = useHomeStore((s) => s.mode);
  const activeCount = Object.values(rooms).filter((r) => r.isOn).length;

  return (
    <View style={styles.quickStatus}>
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: mode === 'auto' ? colors.primary : colors.warning }]} />
        <Text style={styles.statusPillText}>
          {mode === 'auto' ? 'Auto' : 'Manual'}
        </Text>
      </View>
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: motionDetected ? colors.success : 'rgba(255,255,255,0.12)' }]} />
        <Text style={styles.statusPillText}>
          {motionDetected ? 'Motion' : 'Idle'}
        </Text>
      </View>
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: activeCount > 0 ? colors.accent : 'rgba(255,255,255,0.12)' }]} />
        <Text style={styles.statusPillText}>
          {activeCount} {activeCount === 1 ? 'device' : 'devices'}
        </Text>
      </View>
    </View>
  );
}

function Greeting() {
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  return (
    <View style={styles.greeting}>
      <Text style={styles.greetingText}>{greeting}</Text>
      <Text style={styles.greetingSub}>Your home is running normally</Text>
    </View>
  );
}

export default function App() {
  useSimulation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <TopBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Greeting />
        <QuickStatus />
        <SensorCards />
        <DeviceControls />
        <ActivityLog />
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
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  greeting: {
    gap: 4,
    paddingTop: spacing.sm,
  },
  greetingText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  quickStatus: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
