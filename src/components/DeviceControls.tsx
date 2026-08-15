import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors, fontSize, spacing, radius, roomColors } from '../theme';
import { useHomeStore, RoomId } from '../store/useHomeStore';
import * as Haptics from 'expo-haptics';

const ROOM_ORDER: RoomId[] = ['living', 'bedroom', 'porch'];

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
        {isAuto && (
          <View style={styles.autoTag}>
            <Text style={styles.autoTagText}>PIR Controlled</Text>
          </View>
        )}
      </View>

      <View style={[styles.list, isAuto && styles.listAuto]}>
        {ROOM_ORDER.map((roomId) => {
          const room = rooms[roomId];
          const rc = roomColors[roomId];
          return (
            <View key={roomId} style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${rc.primary}15` },
                    room.isOn && { backgroundColor: `${rc.primary}30` },
                  ]}
                >
                  <Text style={styles.iconEmoji}>{room.icon}</Text>
                </View>
                <View>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomSub}>{room.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={room.isOn}
                onValueChange={() => handleToggle(roomId)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: rc.primary }}
                thumbColor={room.isOn ? '#fff' : 'rgba(255,255,255,0.5)'}
                ios_backgroundColor="rgba(255,255,255,0.1)"
                disabled={isAuto}
              />
            </View>
          );
        })}
      </View>
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
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  autoTag: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  autoTagText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  list: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  listAuto: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },
  roomName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  roomSub: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
