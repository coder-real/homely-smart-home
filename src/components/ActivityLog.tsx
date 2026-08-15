import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, fontSize, spacing, radius } from '../theme';
import { useHomeStore, ActivityEntry } from '../store/useHomeStore';

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function LogItem({ item }: { item: ActivityEntry }) {
  return (
    <View style={styles.logItem}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <View style={styles.logContent}>
        <Text style={styles.logMessage}>{item.message}</Text>
        <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function ActivityLog() {
  const activityLog = useHomeStore((s) => s.activityLog);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.card}>
        {activityLog.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet</Text>
        ) : (
          <FlatList
            data={activityLog.slice(0, 15)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LogItem item={item} />}
            showsVerticalScrollIndicator={false}
            style={styles.list}
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
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: 200,
  },
  list: {
    // scrollable
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  logContent: {
    flex: 1,
  },
  logMessage: {
    color: colors.textDim,
    fontSize: fontSize.sm,
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
