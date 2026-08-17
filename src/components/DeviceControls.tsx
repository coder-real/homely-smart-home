import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, fontSize, spacing, radius, fontWeight } from '../theme';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import * as Haptics from 'expo-haptics';

const ROOM_ORDER: RoomId[] = ['living', 'bedroom', 'porch'];

const ROOM_META: Record<RoomId, { color: string; glow: string; emoji: string }> = {
  living: { color: colors.roomLiving, glow: colors.roomLivingGlow, emoji: '💡' },
  bedroom: { color: colors.roomBedroom, glow: colors.roomBedroomGlow, emoji: '🌀' },
  porch: { color: colors.roomPorch, glow: colors.roomPorchGlow, emoji: '🔆' },
};

export default function DeviceControls() {
  const rooms = useHomeStore((s) => s.rooms);
  const mode = useHomeStore((s) => s.mode);
  const toggleRoom = useHomeStore((s) => s.toggleRoom);

  const isAuto = mode === 'auto';

  const handleToggle = (roomId: RoomId) => {
    if (isAuto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRoom(roomId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Devices</Text>
        <Text style={styles.count}>
          {Object.values(rooms).filter((r) => r.isOn).length} active
        </Text>
      </View>

      <View style={[styles.list, isAuto && styles.listDisabled]}>
        {ROOM_ORDER.map((roomId, index) => {
          const room = rooms[roomId];
          const meta = ROOM_META[roomId];
          const isLast = index === ROOM_ORDER.length - 1;

          return (
            <View
              key={roomId}
              style={[styles.row, !isLast && styles.rowBorder]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: meta.glow },
                    room.isOn && { backgroundColor: `${meta.color}30` },
                  ]}
                >
                  <Text style={styles.emoji}>{meta.emoji}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomSub}>{room.subtitle}</Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                {room.isOn && (
                  <View style={[styles.activeDot, { backgroundColor: meta.color }]} />
                )}
                <Switch
                  value={room.isOn}
                  onValueChange={() => handleToggle(roomId)}
                  trackColor={{
                    false: 'rgba(255,255,255,0.08)',
                    true: `${meta.color}80`,
                  }}
                  thumbColor={room.isOn ? meta.color : 'rgba(255,255,255,0.3)'}
                  ios_backgroundColor="rgba(255,255,255,0.08)"
                  disabled={isAuto}
                />
              </View>
            </View>
          );
        })}
      </View>

      {isAuto && (
        <View style={styles.autoNote}>
          <Text style={styles.autoNoteText}>
            Devices are controlled by the PIR sensor in Auto mode
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  list: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  listDisabled: {
    opacity: 0.35,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  rowInfo: {
    gap: 2,
  },
  roomName: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  roomSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  autoNote: {
    paddingHorizontal: spacing.sm,
  },
  autoNoteText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
});
