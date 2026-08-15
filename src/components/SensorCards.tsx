import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius } from '../theme';
import { useHomeStore } from '../store/useHomeStore';

export default function SensorCards() {
  const temperature = useHomeStore((s) => s.temperature);
  const humidity = useHomeStore((s) => s.humidity);
  const motionDetected = useHomeStore((s) => s.motionDetected);

  return (
    <View style={styles.container}>
      {/* Environment */}
      <Text style={styles.sectionTitle}>Environment</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.icon}>🌡️</Text>
          <Text style={styles.value}>{temperature.toFixed(1)}°</Text>
          <Text style={styles.label}>Temperature</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.value}>{humidity}%</Text>
          <Text style={styles.label}>Humidity</Text>
        </View>
      </View>

      {/* Motion Status */}
      <View style={[styles.motionCard, motionDetected && styles.motionCardActive]}>
        <View style={[styles.motionDot, motionDetected && styles.motionDotActive]} />
        <Text style={[styles.motionText, motionDetected && styles.motionTextActive]}>
          {motionDetected ? 'Motion Detected' : 'No Motion'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 4,
  },
  label: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  motionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  motionCardActive: {
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  motionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  motionDotActive: {
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  motionText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  motionTextActive: {
    color: colors.green,
  },
});
