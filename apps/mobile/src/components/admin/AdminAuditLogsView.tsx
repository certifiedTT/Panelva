import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  ActivityIcon,
  CloseIcon,
  RefreshCwIcon,
} from '../common/Icons';
import { MOCK_AUDIT_LOGS } from '../../data/mockData';

export function AdminAuditLogsView() {
  const { colors } = useTheme();
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const logsQuery = (trpc.admin.getAuditLogs as any).useQuery();
  const { data: logs, isLoading, refetch, isRefetching } = logsQuery;
  const effectiveLogs = (logs && logs.length > 0) ? logs : MOCK_AUDIT_LOGS;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>IMMUTABLE AUDIT TRAIL</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ padding: 4 }}>
            <RefreshCwIcon size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading audit logs...</Text>
          </View>
        ) : (effectiveLogs || []).length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
            <ActivityIcon size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Audit Logs</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Administrative actions will appear here in chronological order.
            </Text>
          </View>
        ) : (
          effectiveLogs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={[
                styles.logCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
              ]}

              onPress={() => setSelectedLog(log)}
              activeOpacity={0.7}
            >
              <View style={styles.logTopRow}>
                <View style={[styles.actionBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Text style={[styles.actionBadgeText, { color: colors.primary }]}>{log.action}</Text>
                </View>
                <Text style={[styles.logDate, { color: colors.textMuted }]}>{log.timestamp}</Text>
              </View>

              <Text style={[styles.logAdmin, { color: colors.text }]}>
                Actor: <Text style={{ fontWeight: '700' }}>{log.admin}</Text>
              </Text>

              <Text style={[styles.logDetailsSnippet, { color: colors.textMuted }]} numberOfLines={1}>
                {log.details}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Audit Record Details</Text>
                <TouchableOpacity onPress={() => setSelectedLog(null)}>
                  <CloseIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ACTION</Text>
                <Text style={[styles.fieldVal, { color: colors.primary, fontWeight: '700' }]}>
                  {selectedLog.action}
                </Text>

                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>ACTOR</Text>
                <Text style={[styles.fieldVal, { color: colors.text }]}>{selectedLog.admin}</Text>

                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>TIMESTAMP</Text>
                <Text style={[styles.fieldVal, { color: colors.text }]}>{selectedLog.timestamp}</Text>

                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>RECORD ID</Text>
                <Text style={[styles.fieldVal, { color: colors.textMuted, fontSize: 11 }]}>{selectedLog.id}</Text>

                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>RAW PAYLOAD</Text>
                <View style={[styles.codeBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.codeText, { color: colors.text }]}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.details);
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  logCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  logDate: {
    fontSize: 11,
  },
  logAdmin: {
    fontSize: 13,
    marginBottom: 4,
  },
  logDetailsSnippet: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  fieldVal: {
    fontSize: 13,
  },
  codeBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
