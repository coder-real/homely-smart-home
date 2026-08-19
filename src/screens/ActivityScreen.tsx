import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, fontSize, spacing, radius, fontFamily } from '../theme';
import { useHomeStore, ActivityEntry } from '../store/useHomeStore';
import TopBar from '../components/TopBar';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
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
  const clearActivityLog = useHomeStore((s) => s.clearActivityLog);
  const { today, older } = groupLog(log);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    if (log.length === 0) {
      Alert.alert('No Logs Available', 'There are currently no activity logs recorded to export.');
      return;
    }

    try {
      setIsExporting(true);

      // Build standard RFC 4180 CSV
      const headers = 'ID,Date,Time,Timestamp,Room,Event,Details\n';
      const rows = log
        .map((entry) => {
          const date = formatDate(entry.timestamp);
          const time = formatTime(entry.timestamp);
          const room = entry.roomId || 'System';
          const msg = `"${entry.message.replace(/"/g, '""')}"`;
          const sub = `"${entry.subtitle.replace(/"/g, '""')}"`;
          return `${entry.id},${date},${time},${entry.timestamp},${room},${msg},${sub}`;
        })
        .join('\n');

      const csvContent = headers + rows;
      const fileUri = `${FileSystem.cacheDirectory}homely_activity_log_${Date.now()}.csv`;

      // Save CSV to device cache directory
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Trigger native share/export sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Activity Log CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export Ready', `CSV saved locally at:\n${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'An error occurred while exporting logs.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLogs = () => {
    if (log.length === 0) return;
    Alert.alert(
      'Clear Activity Log',
      'Are you sure you want to delete all saved activity logs from local storage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearActivityLog(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and Action Buttons */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.pageTitle}>Activity Log</Text>
              <Text style={styles.pageSubtitle}>Saved locally on your device.</Text>
            </View>
            <View style={styles.actionRow}>
              {/* Export CSV Button */}
              <TouchableOpacity
                style={[styles.actionBtn, isExporting && styles.actionBtnDisabled]}
                onPress={handleExportCsv}
                activeOpacity={0.8}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.amber} />
                ) : (
                  <>
                    <Feather name="download" size={14} color={colors.amber} />
                    <Text style={styles.actionBtnText}>Export CSV</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Clear Logs Button (only when logs exist) */}
              {log.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearLogs}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Grouped Logs */}
        <GroupSection label="TODAY" entries={today} />
        <GroupSection label="PREVIOUS EVENTS" entries={older} />

        {/* Empty State */}
        {today.length === 0 && older.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Feather name="activity" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No activity recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Sensor events, relay toggles, and mode changes will automatically save here.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xl },
  header: { paddingTop: spacing.xs },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTitleCol: { flex: 1, gap: 2 },
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: {
    color: colors.amber,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { gap: spacing.md },
  groupLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
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
    fontVariant: ['tabular-nums'],
  },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
