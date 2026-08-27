import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore } from '../store/useHomeStore';
import { reconnect, setManualIp, setMode as apiSetMode } from '../api/esp32';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import TopBar from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const esp32Ip    = useHomeStore((s) => s.esp32Ip);
  const isConnected = useHomeStore((s) => s.isConnected);
  const lastUpdated = useHomeStore((s) => s.lastUpdated);
  const setEsp32Ip  = useHomeStore((s) => s.setEsp32Ip);
  const defaultMode = useHomeStore((s) => s.defaultMode);
  const setDefaultMode = useHomeStore((s) => s.setDefaultMode);

  const [ipDraft, setIpDraft] = useState(esp32Ip);
  const [modeOpen, setModeOpen] = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [discovering, setDiscovering] = useState(false);

  const handleAutoDiscover = useCallback(async () => {
    setDiscovering(true);
    setTestResult(null);
    const found = await reconnect();
    setTestResult(found ? 'success' : 'fail');
    setDiscovering(false);
    if (found) {
      setIpDraft(useHomeStore.getState().esp32Ip);
    }
  }, []);

  const handleTestConnect = useCallback(async () => {
    setTesting(true);
    setTestResult(null);

    const ip = ipDraft.trim();
    setEsp32Ip(ip);
    setManualIp(ip);

    const found = await reconnect();
    setTestResult(found ? 'success' : 'fail');
    setTesting(false);
  }, [ipDraft]);

  const handleIpChange = (v: string) => {
    setIpDraft(v);
    setTestResult(null);
  };

  const handleModeSelect = async (m: 'auto' | 'manual') => {
    setDefaultMode(m);
    useHomeStore.getState().setMode(m);
    setModeOpen(false);
    // Transmit updated mode directly to the ESP32 controller
    await apiSetMode(m);
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

        {/* ── 1. Setup & Connection Guide Link (Prominent Top Position) ── */}
        <TouchableOpacity
          style={styles.guideLinkBtn}
          onPress={() => navigation.navigate('SetupGuide')}
          activeOpacity={0.8}
        >
          <View style={styles.guideLinkLeft}>
            <View style={styles.guideLinkIcon}>
              <Feather name="book-open" size={17} color={colors.amber} />
            </View>
            <View style={styles.guideLinkTextCol}>
              <Text style={styles.guideLinkTitle}>How to Connect &amp; Setup</Text>
              <Text style={styles.guideLinkSub}>Step-by-step controller setup guide</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ── 2. Connection Section ── */}
        <SectionCard icon="wifi" title="Connection">

          {/* Live status banner */}
          <View style={[styles.statusBanner, isConnected ? styles.statusBannerOn : styles.statusBannerOff]}>
            <View style={styles.statusBannerLeft}>
              <View style={[styles.statusPulse, isConnected ? styles.statusPulseOn : styles.statusPulseOff]} />
              <View>
                <Text style={[styles.statusBannerTitle, { color: isConnected ? colors.success : '#F87171' }]}>
                  {isConnected ? 'Connected' : 'Not connected'}
                </Text>
                {isConnected && lastUpdated > 0 && (
                  <Text style={styles.statusBannerSub}>
                    Last update at {formatTime(lastUpdated)}
                  </Text>
                )}
                {!isConnected && (
                  <Text style={styles.statusBannerSub}>
                    Tap "Auto-Discover" to find your device
                  </Text>
                )}
              </View>
            </View>
            <Feather
              name={isConnected ? 'check-circle' : 'wifi-off'}
              size={20}
              color={isConnected ? colors.success : '#F87171'}
            />
          </View>

          {/* Auto-Discover button */}
          <TouchableOpacity
            style={[styles.discoverBtn, discovering && styles.discoverBtnLoading]}
            onPress={handleAutoDiscover}
            activeOpacity={0.8}
            disabled={discovering || testing}
          >
            {discovering ? (
              <>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.discoverBtnText}>Scanning network…</Text>
              </>
            ) : (
              <>
                <Feather name="search" size={15} color="#000" />
                <Text style={styles.discoverBtnText}>Auto-Discover</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Test result pill */}
          {testResult !== null && (
            <View style={[
              styles.testResultPill,
              testResult === 'success' ? styles.testResultSuccess : styles.testResultFail,
            ]}>
              <Feather
                name={testResult === 'success' ? 'check' : 'x'}
                size={13}
                color={testResult === 'success' ? colors.success : '#F87171'}
              />
              <Text style={[
                styles.testResultText,
                { color: testResult === 'success' ? colors.success : '#F87171' },
              ]}>
                {testResult === 'success'
                  ? `Connected${esp32Ip ? ` to ${esp32Ip}` : ''}`
                  : 'Could not find device — check Wi-Fi'}
              </Text>
            </View>
          )}

          {/* Manual IP fallback (collapsible) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Manual IP (advanced)</Text>
            <TextInput
              style={[
                styles.input,
                testResult === 'success' && styles.inputSuccess,
                testResult === 'fail'    && styles.inputFail,
              ]}
              value={ipDraft}
              onChangeText={handleIpChange}
              placeholder="e.g. 192.168.1.42"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleTestConnect}
            />
            <Text style={styles.inputHint}>
              Only needed if auto-discovery fails. Leave blank for automatic detection.
            </Text>
          </View>

          {/* Manual connect button */}
          <TouchableOpacity
            style={[styles.connectBtn, testing && styles.connectBtnLoading]}
            onPress={handleTestConnect}
            activeOpacity={0.8}
            disabled={testing || discovering}
          >
            {testing ? (
              <>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={styles.connectBtnText}>Testing…</Text>
              </>
            ) : (
              <>
                <Feather name="refresh-cw" size={15} color={colors.text} />
                <Text style={styles.connectBtnText}>Connect to IP</Text>
              </>
            )}
          </TouchableOpacity>

        </SectionCard>

        {/* ── 3. Preferences Section ── */}
        <SectionCard icon="sliders" title="Preferences">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>System Mode</Text>
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
                {(['manual', 'auto'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.dropdownOption,
                      defaultMode === m && styles.dropdownOptionActive,
                    ]}
                    onPress={() => handleModeSelect(m)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        defaultMode === m && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {m === 'auto' ? 'Auto (Sensor automation)' : 'Manual (Direct app control)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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

  // Setup Guide Link Card
  guideLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  guideLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  guideLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLinkTextCol: {
    flex: 1,
    gap: 2,
  },
  guideLinkTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  guideLinkSub: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusBannerOn: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  statusBannerOff: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  statusBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  statusPulse: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusPulseOn: { backgroundColor: colors.success },
  statusPulseOff: { backgroundColor: '#F87171' },
  statusBannerTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  statusBannerSub: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 1,
  },

  // IP input
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
  inputSuccess: { borderColor: 'rgba(16,185,129,0.5)' },
  inputFail:    { borderColor: 'rgba(248,113,113,0.5)' },
  inputHint: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  inputHintMono: {
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },

  // Test result pill
  testResultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  testResultSuccess: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  testResultFail: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  testResultText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },

  // Connect button
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  connectBtnLoading: { opacity: 0.6 },
  connectBtnText: {
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },

  // Auto-Discover button
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  discoverBtnLoading: { opacity: 0.6 },
  discoverBtnText: {
    color: '#000',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },

  // Dropdown
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
});
