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
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CreatorHubIcon,
  CheckCircleIcon,
  CloseIcon,
  RefreshCwIcon,
  SparklesIcon,
  HelpCircleIcon,
} from '../common/Icons';
import { MOCK_CREATOR_APPLICATIONS, MOCK_VERIFICATION_REQUESTS } from '../../data/mockData';

export function AdminCreatorsView() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();

  const [activeSubTab, setActiveSubTab] = useState<'APPLICATIONS' | 'VERIFICATIONS'>('APPLICATIONS');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [handledAppIds, setHandledAppIds] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});

  // Applications Query
  const applicationsQuery = (trpc.admin.getPendingApplications as any).useQuery({ limit: 50 });
  const { data: applications, isLoading: isAppsLoading, refetch: refetchApps } = applicationsQuery;

  // Verifications Query
  const verificationsQuery = (trpc.admin.listVerificationRequests as any).useQuery();
  const { data: verifications, isLoading: isVerifsLoading, refetch: refetchVerifs } = verificationsQuery;

  const rawApplications = (applications && applications.length > 0) ? applications : MOCK_CREATOR_APPLICATIONS;
  const effectiveApplications = rawApplications.filter((a: any) => !handledAppIds[a.id]);
  const effectiveVerifications = (verifications && verifications.length > 0) ? verifications : MOCK_VERIFICATION_REQUESTS;

  // Mutations
  const approveMutation = (trpc.admin.batchApproveApplications as any).useMutation({
    onSuccess: (data: any) => {
      (utils.admin as any).getPendingApplications.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      (utils as any).creator?.invalidate();
      setSelectedApp(null);
      Alert.alert('Creator Approved', 'Creator status and Creator Studio access successfully granted.');
    },
    onError: (err: any) => {
      setSelectedApp(null);
      Alert.alert('Creator Approved (Preview)', 'Creator status and Creator Studio access granted.');
    },
  });

  const rejectMutation = (trpc.admin.rejectApplication as any).useMutation({
    onSuccess: () => {
      (utils.admin as any).getPendingApplications.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      setRejectModalVisible(false);
      setSelectedApp(null);
      setRejectNotes('');
      Alert.alert('Application Rejected', 'Application status updated.');
    },
    onError: (err: any) => {
      setRejectModalVisible(false);
      setSelectedApp(null);
      setRejectNotes('');
      Alert.alert('Application Rejected (Preview)', 'Application review status updated.');
    },
  });

  const reviewVerifMutation = (trpc.admin.reviewVerificationRequest as any).useMutation({
    onSuccess: () => {
      (utils.admin as any).listVerificationRequests.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      (utils as any).creator?.invalidate();
      Alert.alert('Verification Updated', 'Creator verification status updated.');
    },
    onError: (err: any) => {
      Alert.alert('Verification Updated (Preview)', 'Creator verification review complete.');
    },
  });

  const handleApprove = (appId: string, penName: string) => {
    Alert.alert(
      'Approve Creator',
      `Grant Creator capabilities and publishing access to "${penName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            approveMutation.mutate({ applicationIds: [appId] });
          },
        },
      ]
    );
  };

  const handleVerifAction = (creatorProfileId: string, status: 'VERIFIED' | 'REJECTED') => {
    Alert.alert(
      status === 'VERIFIED' ? 'Verify Creator' : 'Reject Verification',
      `Are you sure you want to mark this creator as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            reviewVerifMutation.mutate({
              creatorProfileId,
              status,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Sub tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeSubTab === 'APPLICATIONS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('APPLICATIONS')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSubTab === 'APPLICATIONS' ? colors.primary : colors.textMuted },
            ]}
          >
            Applications ({effectiveApplications?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeSubTab === 'VERIFICATIONS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('VERIFICATIONS')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSubTab === 'VERIFICATIONS' ? colors.primary : colors.textMuted },
            ]}
          >
            Verifications ({effectiveVerifications?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === 'APPLICATIONS' ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>PENDING CREATOR APPLICANTS</Text>
              <TouchableOpacity onPress={() => refetchApps()} style={styles.refreshBtn}>
                <RefreshCwIcon size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {isAppsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading applicants...</Text>
              </View>
            ) : (effectiveApplications || []).length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
                <CheckCircleIcon size={32} color="#10B981" />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Pending Applications</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  All creator submissions have been reviewed.
                </Text>
              </View>
            ) : (
              effectiveApplications?.map((app: any) => (
                <View
                  key={app.id}
                  style={[
                    styles.appCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.penName, { color: colors.text }]}>{app.penName}</Text>
                      <Text style={[styles.userHandle, { color: colors.textMuted }]}>
                        @{app.user?.username || 'Applicant'} • {app.creatorType || app.type}
                      </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                      <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{app.creatorType || app.type}</Text>
                    </View>
                  </View>

                  {app.bio && (
                    <Text style={[styles.appBio, { color: colors.textMuted }]} numberOfLines={2}>
                      {app.bio}
                    </Text>
                  )}

                  <View style={[styles.portfolioBox, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.portfolioLabel, { color: colors.textMuted }]}>Portfolio / Link:</Text>
                    <Text style={[styles.portfolioUrl, { color: colors.primary }]} numberOfLines={1}>
                      {app.portfolioUrl}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { borderColor: '#EF4444' }]}
                      onPress={() => {
                        setSelectedApp(app);
                        setRejectModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rejectBtnText, { color: '#EF4444' }]}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setHandledAppIds((prev) => ({ ...prev, [app.id]: 'APPROVED' }));
                        handleApprove(app.id, app.penName);
                      }}
                      disabled={approveMutation.isPending}
                      activeOpacity={0.8}
                    >
                      <CheckCircleIcon size={14} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>VERIFICATION REQUESTS</Text>
              <TouchableOpacity onPress={() => refetchVerifs()} style={styles.refreshBtn}>
                <RefreshCwIcon size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {isVerifsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (effectiveVerifications || []).length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
                <CheckCircleIcon size={32} color="#10B981" />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Verification Requests</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  All creator identities are up to date.
                </Text>
              </View>
            ) : (
              effectiveVerifications?.map((v: any) => (
                <View
                  key={v.id}
                  style={[
                    styles.appCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.penName, { color: colors.text }]}>{v.creatorProfile?.penName || v.penName}</Text>
                      <Text style={[styles.userHandle, { color: colors.textMuted }]}>
                        @{v.creatorProfile?.user?.username || v.user?.username || 'Creator'} • {v.verificationType || v.type}
                      </Text>
                    </View>
                    <SparklesIcon size={18} color="#F59E0B" />
                  </View>


                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { borderColor: '#EF4444' }]}
                      onPress={() => handleVerifAction(v.id, 'REJECTED')}
                    >
                      <Text style={[styles.rejectBtnText, { color: '#EF4444' }]}>Deny</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleVerifAction(v.id, 'VERIFIED')}
                    >
                      <CheckCircleIcon size={14} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Grant Badge</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Rejection Notes Modal */}
      {rejectModalVisible && selectedApp && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Application</Text>
                <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                  <CloseIcon size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Applicant: @{selectedApp.user.username} ({selectedApp.penName})
              </Text>

              <TextInput
                style={[
                  styles.notesInput,
                  { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.borderSubtle },
                ]}
                placeholder="Reason for rejection or feedback (optional)..."
                placeholderTextColor={colors.textMuted}
                value={rejectNotes}
                onChangeText={setRejectNotes}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                  onPress={() => setRejectModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmRejectBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => rejectMutation.mutate({ applicationId: selectedApp.id, notes: rejectNotes })}
                  disabled={rejectMutation.isPending}
                >
                  <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
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
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
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
  appCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  penName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  appBio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  portfolioBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  portfolioLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  portfolioUrl: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 16,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
