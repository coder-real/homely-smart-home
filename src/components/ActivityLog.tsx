import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, fontSize, spacing, radius, fontWeight } from '../theme';
import { useHomeStore, ActivityEntry } from '../store/useHomeStore';

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LogItem({ item }: { item: ActivityEntry }) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <Text style={styles.message} numberOfLines={1}>
        {item.message}
      </Text>
      <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
    </View>
  );
}

export default function ActivityLog() {
  const activityLog = useHomeStore((s) => s.activityLog);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <Text style={styles.count}>{activityLog.length} events</Text>
      </View>
      <View style={styles.card}>
        {activityLog.length === 0 ? (
          <Text style={styles.empty}>No activity yet</Text>
        ) : (
          <FlatList
            data={activityLog.slice(0, 10)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LogItem item={item} />}
            scrollEnabled={false}
          />
        )}
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
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  time: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
});
