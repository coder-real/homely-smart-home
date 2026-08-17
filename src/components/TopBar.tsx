import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore } from '../store/useHomeStore';

const logo = require('../../assets/icon.png');

interface TopBarProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export default function TopBar({ showBack, onBack, title }: TopBarProps) {
  const isConnected = useHomeStore((s) => s.isConnected);
  const esp32Ip = useHomeStore((s) => s.esp32Ip);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={18} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.logo} />
          </View>
        )}
        <Text style={styles.title}>{title ?? 'HOMELY'}</Text>
      </View>

      <View style={styles.statusPill}>
        <View style={[styles.statusDot, isConnected && styles.statusDotOn]} />
        <Text style={styles.statusText}>
          {esp32Ip ? `ESP32 ${isConnected ? 'Online' : 'Offline'}` : 'ESP32 Online'}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
    backgroundColor: colors.textMuted,
  },
  statusDotOn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
});
