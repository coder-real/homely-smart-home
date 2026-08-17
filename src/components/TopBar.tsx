import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing, radius, fontWeight } from '../theme';
import { useHomeStore, Mode } from '../store/useHomeStore';

export default function TopBar() {
  const mode = useHomeStore((s) => s.mode);
  const isConnected = useHomeStore((s) => s.isConnected);
  const setMode = useHomeStore((s) => s.setMode);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <View style={styles.logoRoof} />
            <View style={styles.logoBody} />
          </View>
        </View>
        <View>
          <Text style={styles.title}>Homely</Text>
          <Text style={styles.subtitle}>Smart Home</Text>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.pillToggle}>
          <TouchableOpacity
            style={[styles.pillBtn, mode === 'auto' && styles.pillBtnActive]}
            onPress={() => setMode('auto')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, mode === 'auto' && styles.pillTextActive]}>
              Auto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, mode === 'manual' && styles.pillBtnActive]}
            onPress={() => setMode('manual')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, mode === 'manual' && styles.pillTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isConnected && styles.statusDotOn]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Demo'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
  },
  logoRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  logoBody: {
    width: 12,
    height: 9,
    backgroundColor: '#fff',
    marginTop: 1,
    borderRadius: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  pillToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  pillBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  pillBtnActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  pillTextActive: {
    color: colors.textOnPrimary,
  },
  right: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusDotOn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
