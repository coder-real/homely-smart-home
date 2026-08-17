import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore } from '../store/useHomeStore';

export default function SensorCards() {
  const temperature = useHomeStore((s) => s.temperature);
  const humidity = useHomeStore((s) => s.humidity);
  const motionDetected = useHomeStore((s) => s.motionDetected);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Temperature */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(248,113,113,0.1)' }]}>
              <Text style={styles.icon}>🌡</Text>
            </View>
            <Text style={styles.label}>Temperature</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{temperature.toFixed(1)}</Text>
            <Text style={styles.unit}>°C</Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, (temperature / 50) * 100)}%`,
                  backgroundColor: colors.error,
                },
              ]}
            />
          </View>
        </View>

        {/* Humidity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(59,142,255,0.1)' }]}>
              <Text style={styles.icon}>💧</Text>
            </View>
            <Text style={styles.label}>Humidity</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{humidity}</Text>
            <Text style={styles.unit}>%</Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${humidity}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Motion */}
      <View style={[styles.motionCard, motionDetected && styles.motionCardActive]}>
        <View style={styles.motionLeft}>
          <View style={[styles.motionDot, motionDetected && styles.motionDotActive]} />
          <Text style={[styles.motionLabel, motionDetected && styles.motionLabelActive]}>
            {motionDetected ? 'Motion Detected' : 'No Motion'}
          </Text>
        </View>
        {motionDetected && (
          <View style={styles.motionBadge}>
            <Text style={styles.motionBadgeText}>LIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  value: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    letterSpacing: -1,
  },
  unit: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    marginBottom: 3,
    marginLeft: 2,
  },
  bar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  motionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  motionCardActive: {
    backgroundColor: 'rgba(52,211,153,0.04)',
    borderColor: 'rgba(52,211,153,0.2)',
  },
  motionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  motionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  motionDotActive: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  motionLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  motionLabelActive: {
    color: colors.success,
  },
  motionBadge: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  motionBadgeText: {
    color: colors.success,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
