import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing, radius, fontWeight, fontFamily } from '../theme';
import { useHomeStore, ActivityEntry } from '../store/useHomeStore';
import TopBar from '../components/TopBar';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isToday(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function groupLog(log: ActivityEntry[]) {
  const today: ActivityEntry[] = [];
  const older: ActivityEntry[] = [];
  for (const e of log) {
    if (isToday(e.timestamp)) today.push(e);
    else older.push(e);
  }
  return { today, older };
}

function LogEntry({ entry }: { entry: ActivityEntry }) {
  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryDot, { backgroundColor: entry.color }]} />
      <View style={styles.entryText}>
        <Text style={styles.entryMessage}>{entry.message}</Text>
        <Text style={styles.entrySub}>{entry.subtitle}</Text>
      </View>
      <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
    </View>
  );
}

function GroupSection({ label, entries }: { label: string; entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupCard}>
        {entries.map((e) => (
          <LogEntry key={e.id} entry={e} />
        ))}
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const log = useHomeStore((s) => s.activityLog);
  const { today, older } = groupLog(log);

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
          <Text style={styles.pageTitle}>Activity Log</Text>
          <Text style={styles.pageSubtitle}>Recent events across all monitored zones.</Text>
        </View>

        <GroupSection label="TODAY" entries={today} />
        <GroupSection label="YESTERDAY" entries={older} />

        {today.length === 0 && older.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="activity" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>Events will appear here as your system runs.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.loadMore} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={14} color={colors.textMuted} />
          <Text style={styles.loadMoreText}>LOAD OLDER EVENTS</Text>
        </TouchableOpacity>

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
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  group: { gap: spacing.md },
  groupLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  entryText: { flex: 1, gap: 3 },
  entryMessage: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  entrySub: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  entryTime: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  loadMoreText: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.5,
  },
});
