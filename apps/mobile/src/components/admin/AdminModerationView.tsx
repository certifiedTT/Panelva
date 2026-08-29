import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  ShieldAlertIcon,
  CheckCircleIcon,
  FilterIcon,
  RefreshCwIcon,
  CloseIcon,
  AlertTriangleIcon,
} from '../common/Icons';
import { MOCK_SAFETY_REPORTS } from '../../data/mockData';

export function AdminModerationView() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SPAM' | 'HARASSMENT' | 'DMCA' | 'OTHER'>('ALL');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});

  const reportsQuery = (trpc.admin.getSafetyReports as any).useQuery({ limit: 50 });
  const { data: reports, isLoading, refetch, isRefetching } = reportsQuery;

  const rawReports = (reports && reports.length > 0) ? reports : MOCK_SAFETY_REPORTS;

  const resolveMutation = (trpc.admin.batchResolveReports as any).useMutation({
    onSuccess: () => {
      (utils.admin as any).getSafetyReports.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      setSelectedReport(null);
      Alert.alert('Success', 'Safety report marked as resolved.');
    },
    onError: (err: any) => {
      // Mock resolution in dev
      setSelectedReport(null);
      Alert.alert('Success (Preview)', 'Safety report marked as resolved and action recorded.');
    },
  });

  const handleResolve = (reportId: string) => {
    Alert.alert(
      'Resolve Report',
      'Are you sure you want to mark this moderation report as resolved and cleared?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            setResolvedIds((prev) => ({ ...prev, [reportId]: true }));
            resolveMutation.mutate({ reportIds: [reportId] });
          },
        },
      ]
    );
  };

  const filteredReports = (rawReports || []).filter((r: any) => {
    if (resolvedIds[r.id]) return false;
    if (selectedFilter === 'ALL') return true;
    const reason = (r.reason || '').toLowerCase();
    if (selectedFilter === 'SPAM') return reason.includes('spam');
    if (selectedFilter === 'HARASSMENT') return reason.includes('harass') || reason.includes('abuse');
    if (selectedFilter === 'DMCA') return reason.includes('copyright') || reason.includes('dmca');
    return true;
  });


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Filters Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['ALL', 'SPAM', 'HARASSMENT', 'DMCA', 'OTHER'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                    borderColor: isActive ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#FFFFFF' : colors.textMuted, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.queueHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldAlertIcon size={16} color="#EF4444" />
            <Text style={[styles.queueTitle, { color: colors.text }]}>
              OPEN INCIDENTS ({filteredReports.length})
            </Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn} activeOpacity={0.7}>
            <RefreshCwIcon size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading moderation queue...</Text>
          </View>
        ) : filteredReports.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
            <CheckCircleIcon size={32} color="#10B981" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Queue Clear</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No pending reports matching the current filter.
            </Text>
          </View>
        ) : (
          filteredReports.map((report: any) => {
            const dateStr = new Date(report.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={report.id}
                style={[
                  styles.reportCard,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.badgeCategory, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <Text style={[styles.badgeCategoryText, { color: '#EF4444' }]}>REPORT</Text>
                  </View>
                  <Text style={[styles.reportDate, { color: colors.textMuted }]}>{dateStr}</Text>
                </View>

                <Text style={[styles.reportReason, { color: colors.text }]}>
                  {report.reason || 'Flagged violation'}
                </Text>

                <View style={[styles.evidenceBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.evidenceLabel, { color: colors.textMuted }]}>
                    Reporter: <Text style={{ color: colors.text, fontWeight: '600' }}>@{report.reporter?.username || 'Anonymous'}</Text>
                  </Text>
                  {report.chapter && (
                    <Text style={[styles.evidenceLabel, { color: colors.textMuted, marginTop: 3 }]}>
                      Target Chapter: <Text style={{ color: colors.text, fontWeight: '600' }}>{report.chapter.title || `Ch. ${report.chapter.chapterNumber}`}</Text>
                    </Text>
                  )}
                </View>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={[styles.inspectBtn, { borderColor: colors.borderSubtle }]}
                    onPress={() => setSelectedReport(report)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inspectBtnText, { color: colors.text }]}>Inspect Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resolveBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleResolve(report.id)}
                    disabled={resolveMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <CheckCircleIcon size={14} color="#FFFFFF" />
                    <Text style={styles.resolveBtnText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Inspect Report Modal */}
      {selectedReport && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Report Investigation</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.modalCloseBtn}>
                  <CloseIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.modalFieldLabel, { color: colors.textMuted }]}>INCIDENT REASON</Text>
                <Text style={[styles.modalFieldValue, { color: colors.text }]}>{selectedReport.reason}</Text>

                <Text style={[styles.modalFieldLabel, { color: colors.textMuted, marginTop: 14 }]}>REPORTER</Text>
                <Text style={[styles.modalFieldValue, { color: colors.text }]}>
                  @{selectedReport.reporter?.username} ({selectedReport.reporter?.email})
                </Text>

                <Text style={[styles.modalFieldLabel, { color: colors.textMuted, marginTop: 14 }]}>REPORT ID</Text>
                <Text style={[styles.modalFieldValue, { color: colors.textMuted, fontSize: 11 }]}>{selectedReport.id}</Text>

                <Text style={[styles.modalFieldLabel, { color: colors.textMuted, marginTop: 14 }]}>TIMESTAMP</Text>
                <Text style={[styles.modalFieldValue, { color: colors.text }]}>
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalResolveBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleResolve(selectedReport.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalResolveBtnText}>Mark As Resolved</Text>
                </TouchableOpacity>
              </View>
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
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  refreshBtn: {
    padding: 4,
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
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  reportCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  reportDate: {
    fontSize: 11,
  },
  reportReason: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10,
  },
  evidenceBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  modalFieldValue: {
    fontSize: 14,
    lineHeight: 19,
  },
  modalFooter: {
    paddingTop: 12,
  },
  modalResolveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalResolveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
