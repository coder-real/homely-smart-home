import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing } from '../theme';
import { useHomeStore, Mode } from '../store/useHomeStore';

export default function TopBar() {
  const mode = useHomeStore((s) => s.mode);
  const isConnected = useHomeStore((s) => s.isConnected);
  const setMode = useHomeStore((s) => s.setMode);

  return (
    <View style={styles.container}>
      {/* Left: Logo + Title */}
      <View style={styles.left}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>⌂</Text>
        </View>
        <Text style={styles.title}>Smart Home</Text>
      </View>

      {/* Center: Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'auto' && styles.modeBtnActive]}
          onPress={() => setMode('auto')}
          activeOpacity={0.7}
        >
          <Text style={[styles.modeBtnText, mode === 'auto' && styles.modeBtnTextActive]}>
            Auto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
          onPress={() => setMode('manual')}
          activeOpacity={0.7}
        >
          <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right: Connection Status */}
      <View style={styles.right}>
        {mode === 'auto' && (
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>PIR Active</Text>
          </View>
        )}
        <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
        <Text style={styles.statusText}>
          {isConnected ? 'ESP32' : 'Simulated'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 2,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeBtnText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  autoBadgeText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusDotConnected: {
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusText: {
    color: colors.textDim,
    fontSize: fontSize.xs,
  },
});
