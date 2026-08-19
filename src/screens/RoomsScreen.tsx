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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import TopBar from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ROOM_BG: Record<RoomId, any> = {
  living: require('../../assets/living room bg image.jpg'),
  bedroom: require('../../assets/bedroom bg image.jpg'),
  porch: require('../../assets/porch bg image.jpg'),
};

// How far to shift each image downward so the room subject centres in the card.
// Positive value moves the image down (revealing more of the lower portion).
const ROOM_IMG_OFFSET: Record<RoomId, number> = {
  living:  -40,  // sofa + fireplace — shift up slightly from centre
  bedroom: -60,  // bed + lamp — mid-lower subject
  porch:   -50,  // wall lamp + seating — mid-lower
};

const ROOM_ORDER: RoomId[] = ['living', 'bedroom', 'porch'];

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

function RoomCard({ roomId }: { roomId: RoomId }) {
  const navigation = useNavigation<Nav>();
  const room = useHomeStore((s) => s.rooms[roomId]);
  const isOn = room.isOn || (roomId === 'bedroom' && !!room.fanOn);
  const accentColor = ROOM_COLOR[roomId];
  const iconName = ROOM_ICON[roomId];

  return (
    <TouchableOpacity
      style={[styles.card, isOn && { borderColor: colors.borderAmber }]}
      onPress={() => navigation.navigate('RoomDetail', { roomId })}
      activeOpacity={0.85}
    >
      <Image
        source={ROOM_BG[roomId]}
        style={[styles.cardImage, { top: ROOM_IMG_OFFSET[roomId] }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Top */}
      <View style={styles.cardTop}>
        <View style={[styles.iconBadge, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: colors.border }]}>
          <Feather name={iconName} size={16} color={isOn ? accentColor : colors.textSecondary} />
        </View>
        <View style={[styles.stateBadge, isOn ? styles.stateBadgeOn : styles.stateBadgeOff]}>
          <Text style={[styles.stateText, isOn && styles.stateTextOn]}>
            {isOn ? 'ACTIVE' : 'STANDBY'}
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={styles.cardBottom}>
<Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomSubtitle}>{room.subtitle}</Text>
        <View style={styles.modeRow}>
          <Feather name={room.mode === 'auto' ? 'zap' : 'sliders'} size={12} color={accentColor} />
          <Text style={[styles.modeTag, { color: accentColor }]}>
            {room.mode === 'auto' ? 'Auto sensor control' : 'Manual app control'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Home</Text>
          <Text style={styles.pageSubtitle}>Tap a room to view and control its devices.</Text>
        </View>

        <View style={styles.grid}>
          {ROOM_ORDER.map((id) => (
            <View key={id} style={styles.gridItem}>
              <RoomCard roomId={id} />
            </View>
          ))}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '100%' },
  card: {
    height: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cardImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Height larger than card so vertical offset has room to pan
    height: 340,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  stateBadgeOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  stateBadgeOff: { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: colors.border },
  stateText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  stateTextOn: { color: '#000' },
  cardBottom: { gap: 3 },
  relayBadge: { alignSelf: 'flex-start' },
  relayBadgeText: {
    color: colors.amber,
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  roomName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  roomSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modeTag: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
  },
});
