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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import TopBar from '../components/TopBar';
import { useRoomToggle } from '../hooks/useRoomToggle';
import * as Haptics from 'expo-haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ROOM_BG: Record<RoomId, any> = {
  living: require('../../assets/living room bg image.jpg'),
  bedroom: require('../../assets/bedroom bg image.jpg'),
  porch: require('../../assets/porch bg image.jpg'),
};

const ROOM_ICON: Record<RoomId, keyof typeof Feather.glyphMap> = {
  living: 'tv',
  bedroom: 'moon',
  porch: 'sun',
};

const ROOM_COLOR: Record<RoomId, string> = {
  living: colors.roomLiving,
  bedroom: colors.roomBedroom,
  porch: colors.roomPorch,
};

// Per-room vertical image offset — brings the identifiable subject into frame
const ROOM_IMG_OFFSET: Record<RoomId, number> = {
  living:  -40,  // sofa + fireplace
  bedroom: -60,  // bed + lamp
  porch:   -50,  // wall lamp + seating
};

// ── Sensor Widget ────────────────────────────────────────────────
function SensorWidget() {
  const temperature = useHomeStore((s) => s.temperature);
  const humidity = useHomeStore((s) => s.humidity);
  const motionDetected = useHomeStore((s) => s.motionDetected);
  const lastUpdated = useHomeStore((s) => s.lastUpdated);

  const secondsAgo = Math.floor((Date.now() - lastUpdated) / 1000);
  const updatedText =
    secondsAgo < 60
      ? `${secondsAgo}s ago`
      : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <View style={sw.card}>
      <View style={sw.topRow}>
        <View>
          <View style={sw.headerTag}>
            <Feather name="cpu" size={11} color={colors.primaryLight} />
            <Text style={sw.headerTagText}>Bedroom Climate</Text>
          </View>
          <Text style={sw.tempValue}>
            {temperature.toFixed(1)}
            <Text style={sw.tempUnit}>°C</Text>
          </Text>
          <View style={sw.humidRow}>
            <Feather name="droplet" size={13} color={colors.primaryLight} />
            <Text style={sw.humidValue}>{humidity}% humidity</Text>
          </View>
        </View>

        <View style={sw.rightPills}>
          <View style={[sw.motionPill, motionDetected ? sw.motionPillActive : sw.motionPillIdle]}>
            <View style={[sw.motionDot, motionDetected && sw.motionDotActive]} />
            <Text style={[sw.motionText, motionDetected && sw.motionTextActive]}>
              {motionDetected ? 'Motion' : 'Idle'}
            </Text>
          </View>
          <View style={sw.iconBadge}>
            <Feather name="thermometer" size={18} color={colors.success} />
          </View>
        </View>
      </View>

      <View style={sw.bottomRow}>
        <Feather name="refresh-cw" size={11} color={colors.textMuted} />
        <Text style={sw.updated}>UPDATED {updatedText.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const sw = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  headerTagText: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  tempValue: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 44,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  tempUnit: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xxl,
    letterSpacing: 0,
  },
  humidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  humidValue: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  rightPills: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  motionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  motionPillActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  motionPillIdle: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: colors.border,
  },
  motionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  motionDotActive: {
    backgroundColor: colors.success,
  },
  motionText: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  motionTextActive: {
    color: colors.success,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updated: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
  },
});

// ── Room Card ────────────────────────────────────────────────────
function RoomCard({
  roomId,
  large,
}: {
  roomId: RoomId;
  large?: boolean;
}) {
  const navigation = useNavigation<Nav>();
  const room = useHomeStore((s) => s.rooms[roomId]);
  const { toggleRoom: toggleRoomApi } = useRoomToggle();
  const mode = useHomeStore((s) => s.mode);
  const accentColor = ROOM_COLOR[roomId];
  const isOn = room.isOn || (roomId === 'bedroom' && !!room.fanOn);
  const iconName = ROOM_ICON[roomId];

  const handleToggle = (newVal: boolean) => {
    if (mode === 'auto' && room.mode === 'auto' && roomId === 'living') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newVal !== room.isOn) toggleRoomApi(roomId);
  };

  return (
    <TouchableOpacity
      style={[rc.card, large && rc.cardLarge, isOn && { borderColor: colors.borderAmber }]}
      onPress={() => navigation.navigate('RoomDetail', { roomId })}
      activeOpacity={0.85}
    >
      <Image
        source={ROOM_BG[roomId]}
        style={[rc.cardImage, { top: ROOM_IMG_OFFSET[roomId] }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Top badges */}
      <View style={rc.topRow}>
        <View style={[rc.iconBadge, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: colors.border }]}>
          <Feather name={iconName} size={16} color={isOn ? accentColor : colors.textSecondary} />
        </View>
        <View style={[rc.stateBadge, isOn ? rc.stateBadgeOn : rc.stateBadgeOff]}>
          <Text style={[rc.stateText, isOn ? rc.stateTextOn : rc.stateTextOff]}>
            {isOn ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      {/* Bottom info */}
      <View style={rc.bottom}>
        <Text style={rc.name}>{room.name}</Text>
        <Text style={rc.subtitle}>{room.subtitle}</Text>

        {/* ON / OFF pill toggle */}
        <View style={rc.toggle}>
          <TouchableOpacity
            style={[rc.toggleBtn, !room.isOn && rc.toggleBtnActive]}
            onPress={() => handleToggle(false)}
            activeOpacity={0.75}
          >
            <Text style={[rc.toggleText, !room.isOn && rc.toggleTextActive]}>Off</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[rc.toggleBtn, room.isOn && rc.toggleBtnOn]}
            onPress={() => handleToggle(true)}
            activeOpacity={0.75}
          >
            <Text style={[rc.toggleText, room.isOn && rc.toggleTextOn]}>On</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 200,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  cardImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 360,
  },
  cardLarge: {
    height: 220,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  stateBadgeOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  stateBadgeOff: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: colors.border,
  },
  stateText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  stateTextOn: { color: '#000' },
  stateTextOff: { color: colors.textSecondary },
  bottom: { gap: 3 },
  name: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginBottom: 6,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  toggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  toggleBtnOn: { backgroundColor: colors.amber },
  toggleText: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  toggleTextActive: { color: colors.text },
  toggleTextOn: { color: '#000', fontFamily: fontFamily.bold },
});

// ── Recent Activity Strip ────────────────────────────────────────
function RecentActivityStrip() {
  const navigation = useNavigation<Nav>();
  const log = useHomeStore((s) => s.activityLog);
  const recent = log.slice(0, 2);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  };

  return (
    <View style={ra.container}>
      <TouchableOpacity
        style={ra.header}
        onPress={() => navigation.navigate('BottomTabs')}
        activeOpacity={0.7}
      >
        <Text style={ra.title}>Recent Activity</Text>
        <Feather name="arrow-right" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      <View style={ra.list}>
        {recent.map((entry) => (
          <View key={entry.id} style={ra.row}>
            <View style={[ra.dot, { backgroundColor: entry.color }]} />
            <Text style={ra.message} numberOfLines={1}>{entry.message}</Text>
            <Text style={ra.time}>{formatTime(entry.timestamp)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ra = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  time: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});

// ── Home Screen ──────────────────────────────────────────────────
export default function HomeScreen() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingName}>Hi, there</Text>
          <Text style={styles.greetingDate}>{dayName}, {monthDay}</Text>
        </View>

        {/* Sensor widget */}
        <SensorWidget />

        {/* Environments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rooms</Text>
          <RoomCard roomId="living" large />
          {/* 2-col grid */}
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <RoomCard roomId="bedroom" />
            </View>
            <View style={styles.gridCol}>
              <RoomCard roomId="porch" />
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <RecentActivityStrip />

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  greeting: { gap: 2, paddingTop: spacing.xs },
  greetingName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    letterSpacing: -0.5,
  },
  greetingDate: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  section: { gap: spacing.md },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', gap: spacing.md },
  gridCol: { flex: 1 },
});
