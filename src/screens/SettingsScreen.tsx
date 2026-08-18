import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore } from '../store/useHomeStore';
import { discoverDevice, setManualIp } from '../api/esp32';
import TopBar from '../components/TopBar';

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sc.card}>
      <View style={sc.header}>
        <Feather name={icon} size={15} color={colors.primaryLight} />
        <Text style={sc.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: {
    color: colors.primaryLight,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  },
});

function RowItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={ri.row}>
      <Text style={ri.label}>{label}</Text>
      {children}
    </View>
  );
}

const ri = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
});

export default function SettingsScreen() {
  const esp32Ip = useHomeStore((s) => s.esp32Ip);
  const isConnected = useHomeStore((s) => s.isConnected);
  const setEsp32Ip = useHomeStore((s) => s.setEsp32Ip);
  const defaultMode = useHomeStore((s) => s.defaultMode);
  const setDefaultMode = useHomeStore((s) => s.setDefaultMode);

  const [ipDraft, setIpDraft] = useState(esp32Ip);
  const [modeOpen, setModeOpen] = useState(false);

  const saveIp = async () => {
    const ip = ipDraft.trim();
    setEsp32Ip(ip);
    if (ip) {
      setManualIp(ip);
      await discoverDevice();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Manage your system configuration and preferences.</Text>
        </View>

        {/* Connection */}
        <SectionCard icon="wifi" title="Connection">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ESP32 IP Address</Text>
            <TextInput
              style={styles.input}
              value={ipDraft}
              onChangeText={setIpDraft}
              onBlur={saveIp}
              onSubmitEditing={saveIp}
              placeholder="e.g. 192.168.1.42"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <RowItem label="Status">
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isConnected && styles.statusDotOn]} />
              <Text style={[styles.statusText, isConnected ? styles.statusTextOn : styles.statusTextOff]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </RowItem>
        </SectionCard>

        {/* Preferences */}
        <SectionCard icon="sliders" title="Preferences">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Default Mode on Launch</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setModeOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValue}>
                {defaultMode === 'auto' ? 'Auto' : 'Manual'}
              </Text>
              <Feather name={modeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {modeOpen && (
              <View style={styles.dropdownMenu}>
                {(['auto', 'manual'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.dropdownOption,
                      defaultMode === m && styles.dropdownOptionActive,
                    ]}
                    onPress={() => {
                      setDefaultMode(m);
                      setModeOpen(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        defaultMode === m && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {m === 'auto' ? 'Auto' : 'Manual'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </SectionCard>

        {/* About */}
        <SectionCard icon="info" title="About">
          <RowItem label="Version">
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v0.8.2-beta</Text>
            </View>
          </RowItem>
          <TouchableOpacity style={styles.logsBtn} activeOpacity={0.8}>
            <Feather name="terminal" size={15} color={colors.textSecondary} />
            <Text style={styles.logsBtnText}>View System Logs</Text>
          </TouchableOpacity>
        </SectionCard>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  header: { gap: 4, paddingTop: spacing.xs },
  pageTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },

  inputGroup: { gap: spacing.sm },
  inputLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  statusTextOn: { color: colors.success },
  statusTextOff: { color: colors.textMuted },

  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownValue: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
  },
  dropdownMenu: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionActive: { backgroundColor: 'rgba(4,111,217,0.15)' },
  dropdownOptionText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  dropdownOptionTextActive: {
    color: colors.primaryLight,
    fontFamily: fontFamily.bold,
  },

  versionBadge: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  versionText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontVariant: ['tabular-nums'],
  },

  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  logsBtnText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
});
