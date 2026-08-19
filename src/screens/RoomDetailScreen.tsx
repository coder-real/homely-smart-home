import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import { useRoomToggle } from '../hooks/useRoomToggle';
import * as Haptics from 'expo-haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'RoomDetail'>;

const ROOM_BG: Record<RoomId, any> = {
  living: require('../../assets/living room bg image.jpg'),
  bedroom: require('../../assets/bedroom bg image.jpg'),
  porch: require('../../assets/porch bg image.jpg'),
};

const ROOM_COLOR: Record<RoomId, string> = {
  living: colors.roomLiving,
  bedroom: colors.roomBedroom,
  porch: colors.roomPorch,
};

// ── ON/OFF Pill Toggle ───────────────────────────────────────────
function PillToggle({
  value,
  onChange,
  accentColor,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <View style={[pt.wrap, disabled && { opacity: 0.4 }]}>
      <TouchableOpacity
        style={[pt.btn, !value && pt.btnActive]}
        onPress={() => !disabled && onChange(false)}
        activeOpacity={0.75}
      >
        <Text style={[pt.text, !value && pt.textActive]}>OFF</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[pt.btn, value && { backgroundColor: accentColor }]}
        onPress={() => !disabled && onChange(true)}
        activeOpacity={0.75}
      >
        <Text style={[pt.text, value && pt.textOn]}>ON</Text>
        {value && <Feather name="check" size={13} color="#000" style={{ marginLeft: 2 }} />}
      </TouchableOpacity>
    </View>
  );
}

const pt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  btn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 68,
  },
  btnActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  text: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  },
  textActive: { color: colors.text },
  textOn: { color: '#000', fontFamily: fontFamily.bold },
});

// ── Bedroom Specific Device Controls ──
function BedroomControls({ accentColor }: { accentColor: string }) {
  const bedroom = useHomeStore((s) => s.rooms.bedroom);
  const { toggleRoom: toggleRoomApi, toggleBedroomFan } = useRoomToggle();
  const setTargetTemp = useHomeStore((s) => s.setTargetTemp);
  const setRoomMode = useHomeStore((s) => s.setRoomMode);

  const target = bedroom.targetTemp ?? 24.0;
  const isAuto = bedroom.mode === 'auto';

  const handleLightToggle = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (v !== bedroom.isOn) toggleRoomApi('bedroom');
  };

  const handleFanToggle = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBedroomFan(v);
  };

  const adjustTarget = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetTemp(Math.round((target + delta) * 10) / 10);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Bedroom Light Card (Relay CH3) */}
      <View style={[mpc.card, bedroom.isOn && { borderColor: `${accentColor}66` }]}>
        <View style={mpc.topRow}>
          <View style={mpc.leftInfo}>
            <View style={[mpc.iconBox, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
              <Feather name="sun" size={16} color={bedroom.isOn ? accentColor : colors.textMuted} />
            </View>
            <View style={mpc.textColumn}>
              <Text style={mpc.title} numberOfLines={1}>Bedroom Light</Text>
              <Text style={mpc.subtitle} numberOfLines={2}>Always manual</Text>
            </View>
          </View>
          <View style={mpc.badge}>
            <Text style={mpc.badgeText}>MANUAL</Text>
          </View>
        </View>
        <PillToggle
          value={bedroom.isOn}
          onChange={handleLightToggle}
          accentColor={accentColor}
        />
      </View>

      {/* Bedroom Ceiling Fan Card (Relay CH4) */}
      <View style={[mpc.card, bedroom.fanOn && { borderColor: `${colors.primaryLight}66` }]}>
        <View style={mpc.topRow}>
          <View style={mpc.leftInfo}>
            <View style={[mpc.iconBox, { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)' }]}>
              <Feather name="wind" size={16} color={bedroom.fanOn ? colors.primaryLight : colors.textMuted} />
            </View>
            <View style={mpc.textColumn}>
              <Text style={mpc.title} numberOfLines={1}>Ceiling Fan</Text>
              <Text style={mpc.subtitle} numberOfLines={2}>Temperature-controlled automatically</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[mpc.modePill, isAuto ? mpc.modePillAuto : mpc.modePillManual]}
            onPress={() => setRoomMode('bedroom', isAuto ? 'manual' : 'auto')}
            activeOpacity={0.8}
          >
            <Feather name={isAuto ? 'zap' : 'sliders'} size={11} color={isAuto ? colors.primaryLight : colors.amber} />
            <Text style={[mpc.modeText, { color: isAuto ? colors.primaryLight : colors.amber }]}>
              {isAuto ? 'AUTO' : 'MANUAL'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fan Status & Target Temp Box */}
        <View style={mpc.fanControlBox}>
          <View style={mpc.fanStat}>
            <Text style={mpc.fanStatLabel}>TARGET TEMP</Text>
            <View style={mpc.targetStepper}>
              <TouchableOpacity onPress={() => adjustTarget(-0.5)} style={mpc.stepBtn}>
                <Text style={mpc.stepBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={mpc.targetValue}>{target.toFixed(1)}°C</Text>
              <TouchableOpacity onPress={() => adjustTarget(0.5)} style={mpc.stepBtn}>
                <Text style={mpc.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={mpc.fanStat}>
            <Text style={mpc.fanStatLabel}>CURRENT STATUS</Text>
            <Text style={[mpc.fanSpeedText, bedroom.fanOn && { color: colors.primaryLight }]}>
              {bedroom.fanOn ? 'Active' : 'Off'}
            </Text>
          </View>
        </View>

        <PillToggle
          value={!!bedroom.fanOn}
          onChange={handleFanToggle}
          accentColor={colors.primaryLight}
        />
      </View>
    </View>
  );
}

// ── Living Room Specific Controls ──
function LivingRoomControls({ accentColor }: { accentColor: string }) {
  const living = useHomeStore((s) => s.rooms.living);
  const { toggleRoom: toggleRoomApi } = useRoomToggle();
  const setRoomMode = useHomeStore((s) => s.setRoomMode);
  const motionDetected = useHomeStore((s) => s.motionDetected);

  const isAuto = living.mode === 'auto';

  const handleToggle = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (v !== living.isOn) toggleRoomApi('living');
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Living Room Lighting Card */}
      <View style={[mpc.card, living.isOn && { borderColor: `${accentColor}66` }]}>
        <View style={mpc.topRow}>
          <View style={mpc.leftInfo}>
            <View style={[mpc.iconBox, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
              <Feather name="tv" size={16} color={living.isOn ? accentColor : colors.textMuted} />
            </View>
            <View style={mpc.textColumn}>
              <Text style={mpc.title} numberOfLines={1}>Living Room Lighting</Text>
              <Text style={mpc.subtitle} numberOfLines={2}>
                {motionDetected ? 'Motion detected — lights active' : 'Manual or motion-activated'}
              </Text>
            </View>
          </View>
          <View style={mpc.badge}>
            <Text style={mpc.badgeText}>{motionDetected ? 'MOTION' : 'MANUAL'}</Text>
          </View>
        </View>

        <PillToggle
          value={living.isOn}
          onChange={handleToggle}
          accentColor={accentColor}
        />
      </View>

      {/* Motion Sensor Info Cards */}
      <View style={sic.row}>
        <View style={sic.card}>
          <View style={sic.top}>
            <Feather name="activity" size={15} color={motionDetected ? colors.success : colors.textMuted} />
            <View style={[sic.dot, { backgroundColor: motionDetected ? colors.success : colors.border }]} />
          </View>
          <Text style={sic.value}>{motionDetected ? 'Motion Detected' : 'No Motion'}</Text>
          <Text style={sic.label}>Motion Sensor</Text>
        </View>
      </View>
    </View>
  );
}

// ── Porch Specific Controls ──
function PorchControls({ accentColor }: { accentColor: string }) {
  const porch = useHomeStore((s) => s.rooms.porch);
  const { toggleRoom: toggleRoomApi } = useRoomToggle();

  const handleToggle = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (v !== porch.isOn) toggleRoomApi('porch');
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Porch Light Card */}
      <View style={[mpc.card, porch.isOn && { borderColor: `${accentColor}66` }]}>
        <View style={mpc.topRow}>
          <View style={mpc.leftInfo}>
            <View style={[mpc.iconBox, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
              <Feather name="sun" size={16} color={porch.isOn ? accentColor : colors.textMuted} />
            </View>
            <View style={mpc.textColumn}>
              <Text style={mpc.title} numberOfLines={1}>Porch Light</Text>
              <Text style={mpc.subtitle} numberOfLines={2}>Porch exterior light</Text>
            </View>
          </View>
          <View style={mpc.badge}>
            <Text style={mpc.badgeText}>MANUAL ONLY</Text>
          </View>
        </View>
        <PillToggle
          value={porch.isOn}
          onChange={handleToggle}
          accentColor={accentColor}
        />
      </View>

    </View>
  );
}

const mpc = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.amber,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  modePillAuto: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderColor: 'rgba(56,189,248,0.3)',
  },
  modePillManual: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  modeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  fanControlBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  fanStat: { gap: 3 },
  fanStatLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  targetStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  targetValue: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  fanSpeedText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
});

const sic = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  value: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    letterSpacing: -0.3,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});

// ── Room Activity Log ─────────────────────────────────────────────
function RoomActivityLog({ roomId }: { roomId: RoomId }) {
  const log = useHomeStore((s) => s.activityLog);
  const roomLog = log.filter((e) => !e.roomId || e.roomId === roomId).slice(0, 4);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={al.container}>
      <View style={al.header}>
        <Feather name="clock" size={13} color={colors.textMuted} />
        <Text style={al.title}>Zone Activity Log</Text>
      </View>
      <View style={al.list}>
        {roomLog.map((entry) => (
          <View key={entry.id} style={al.row}>
            <View style={[al.iconBox, { backgroundColor: `${entry.color}18`, borderColor: `${entry.color}33` }]}>
              <View style={[al.dot, { backgroundColor: entry.color }]} />
            </View>
            <View style={al.textCol}>
              <Text style={al.message}>{entry.message}</Text>
              <Text style={al.subtitle}>{entry.subtitle}</Text>
            </View>
            <Text style={al.time}>{formatTime(entry.timestamp)}</Text>
          </View>
        ))}
        {roomLog.length === 0 && (
          <Text style={al.empty}>No zone activity recorded yet</Text>
        )}
      </View>
    </View>
  );
}

const al = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  list: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  textCol: { flex: 1, gap: 2 },
  message: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  time: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

// ── Room Detail Screen ───────────────────────────────────────────
export default function RoomDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { roomId } = route.params;

  const room = useHomeStore((s) => s.rooms[roomId]);
  const temperature = useHomeStore((s) => s.temperature);
  const accentColor = ROOM_COLOR[roomId];

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Image */}
      <View style={styles.hero}>
        <Image source={ROOM_BG[roomId]} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', colors.bg]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <SafeAreaView edges={['top']}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.statusPill}>
              <View style={[styles.pillDot, room.isOn && { backgroundColor: colors.success }]} />
              <Text style={styles.pillText}>ESP32 ONLINE</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Room label */}
        <View style={styles.heroBottom}>
          <View style={styles.activeBadge}>
            <View style={[styles.activeDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.activeText, { color: accentColor }]}>
              {room.mode === 'auto' ? 'AUTO' : 'MANUAL'}
            </Text>
          </View>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.roomSubRow}>
            <Feather name="home" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.roomSub}>{room.subtitle}</Text>
          </View>

          {roomId === 'bedroom' && (
            <View style={styles.tempRow}>
              <View>
                <Text style={styles.tempLabel}>BEDROOM TEMPERATURE</Text>
                <Text style={styles.tempValue}>{temperature.toFixed(1)}°C</Text>
              </View>
              <View style={styles.dhtBadge}>
                <Feather name="cpu" size={12} color={colors.success} />
                <Text style={styles.dhtText}>Climate Sensor Active</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Controls</Text>

        {roomId === 'bedroom' && <BedroomControls accentColor={accentColor} />}
        {roomId === 'living' && <LivingRoomControls accentColor={accentColor} />}
        {roomId === 'porch' && <PorchControls accentColor={accentColor} />}

        <RoomActivityLog roomId={roomId} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 340, justifyContent: 'space-between' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  heroBottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  roomName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 38,
    letterSpacing: -1,
  },
  roomSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomSub: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tempLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  tempValue: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    letterSpacing: -0.5,
  },
  dhtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dhtText: {
    color: colors.success,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.lg },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
