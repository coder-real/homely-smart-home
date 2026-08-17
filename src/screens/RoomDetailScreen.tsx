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
import { colors, fontSize, spacing, radius, fontWeight, fontFamily } from '../theme';
import { useHomeStore, RoomId, RoomMode } from '../store/useHomeStore';
import * as Haptics from 'expo-haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'RoomDetail'>;

const ROOM_BG: Record<RoomId, any> = {
  porch: require('../../assets/porch bg image.jpg'),
  living: require('../../assets/living room bg image.jpg'),
  bedroom: require('../../assets/bedroom bg image.jpg'),
};

const ROOM_COLOR: Record<RoomId, string> = {
  porch: colors.roomPorch,
  living: colors.roomLiving,
  bedroom: colors.roomBedroom,
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
        {value && <Feather name="check" size={14} color="#000" style={{ marginLeft: 2 }} />}
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  text: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  textActive: { color: colors.text },
  textOn: { color: '#000', fontFamily: fontFamily.bold, fontWeight: fontWeight.bold },
});

// ── Mode Badge ───────────────────────────────────────────────────
function ModeBadge({ mode, onToggle }: { mode: RoomMode; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[mb.badge, mode === 'auto' ? mb.auto : mb.manual]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Feather
        name={mode === 'auto' ? 'zap' : 'sliders'}
        size={11}
        color={mode === 'auto' ? colors.primaryLight : colors.amber}
      />
      <Text style={[mb.text, { color: mode === 'auto' ? colors.primaryLight : colors.amber }]}>
        {mode === 'auto' ? 'AUTO' : 'MANUAL'}
      </Text>
    </TouchableOpacity>
  );
}

const mb = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  auto: {
    backgroundColor: 'rgba(59,142,255,0.12)',
    borderColor: 'rgba(59,142,255,0.3)',
  },
  manual: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  text: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
});

// ── Main Power Card ──────────────────────────────────────────────
function MainPowerCard({ roomId, accentColor }: { roomId: RoomId; accentColor: string }) {
  const room = useHomeStore((s) => s.rooms[roomId]);
  const toggleRoom = useHomeStore((s) => s.toggleRoom);
  const setRoomMode = useHomeStore((s) => s.setRoomMode);
  const globalMode = useHomeStore((s) => s.mode);
  const isAuto = globalMode === 'auto';

  const handleToggle = (v: boolean) => {
    if (isAuto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (v !== room.isOn) toggleRoom(roomId);
  };

  return (
    <View style={[mpc.card, room.isOn && { borderColor: `${accentColor}66` }]}>
      <View style={mpc.topRow}>
        <View style={mpc.leftInfo}>
          <View style={[mpc.iconBox, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
            <Feather name="power" size={16} color={room.isOn ? accentColor : colors.textMuted} />
          </View>
          <View>
            <Text style={mpc.title}>Main Power</Text>
            <Text style={mpc.subtitle}>All connected devices</Text>
          </View>
        </View>
        <ModeBadge
          mode={room.mode}
          onToggle={() => setRoomMode(roomId, room.mode === 'auto' ? 'manual' : 'auto')}
        />
      </View>
      <PillToggle
        value={room.isOn}
        onChange={handleToggle}
        accentColor={accentColor}
        disabled={isAuto}
      />
    </View>
  );
}

const mpc = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});

// ── Sensor Info Cards ────────────────────────────────────────────
function SensorInfoCards({ roomId, accentColor }: { roomId: RoomId; accentColor: string }) {
  const room = useHomeStore((s) => s.rooms[roomId]);
  const motionDetected = useHomeStore((s) => s.motionDetected);
  const lastMotion = useHomeStore((s) => s.lastMotion);

  const lastMotionText = lastMotion
    ? `${Math.floor((Date.now() - lastMotion) / 60_000)}m ago`
    : 'None';

  return (
    <View style={sic.row}>
      <View style={sic.card}>
        <View style={sic.top}>
          <Feather name="thermometer" size={14} color={accentColor} />
          <View style={[sic.badge, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
            <Text style={[sic.badgeText, { color: accentColor }]}>AUTO</Text>
          </View>
        </View>
        <Text style={sic.value}>{room.temperature ?? '--'}°C</Text>
        <Text style={sic.label}>Climate</Text>
      </View>

      <View style={sic.card}>
        <View style={sic.top}>
          <Feather name="activity" size={14} color={motionDetected ? colors.success : colors.textMuted} />
          <View style={[sic.dot, { backgroundColor: motionDetected ? colors.success : colors.border }]} />
        </View>
        <Text style={sic.value}>{lastMotionText}</Text>
        <Text style={sic.label}>Last Motion</Text>
      </View>
    </View>
  );
}

const sic = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  value: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});

// ── Activity Log ─────────────────────────────────────────────────
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
        <Text style={al.title}>Activity Log</Text>
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
          <Text style={al.empty}>No activity yet</Text>
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
    fontWeight: fontWeight.semibold,
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
    fontWeight: fontWeight.medium,
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
          {room.isOn && (
            <View style={styles.activeBadge}>
              <View style={[styles.activeDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.activeText, { color: accentColor }]}>ACTIVE</Text>
            </View>
          )}
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.roomSubRow}>
            <Feather name="home" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.roomSub}>{room.subtitle}</Text>
          </View>
          {room.temperature != null && (
            <View style={styles.tempRow}>
              <View>
                <Text style={styles.tempLabel}>CURRENT TEMP</Text>
                <Text style={styles.tempValue}>{room.temperature}°C</Text>
              </View>
              <View style={styles.dhtBadge}>
                <Feather name="cpu" size={12} color={colors.success} />
                <Text style={styles.dhtText}>DHT11 Active</Text>
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
        <Text style={styles.sectionLabel}>Environment Controls</Text>
        <MainPowerCard roomId={roomId} accentColor={accentColor} />
        <SensorInfoCards roomId={roomId} accentColor={accentColor} />
        <RoomActivityLog roomId={roomId} />
        <View style={{ height: 30 }} />
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
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  heroBottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.5,
  },
  roomName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 38,
    fontWeight: fontWeight.bold,
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
    fontWeight: fontWeight.bold,
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
    fontWeight: fontWeight.medium,
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.lg },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
