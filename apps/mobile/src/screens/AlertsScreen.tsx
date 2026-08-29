import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { trpc } from '../../lib/trpc';
import {
  AlertsIcon,
  BookOpenIcon,
  SparklesIcon,
  UsersIcon,
  CheckIcon,
  CloseIcon,
} from '../components/common/Icons';
import { MOCK_NOTIFICATIONS } from '../data/mockData';

interface AlertsScreenProps {
  sessionToken: string | null;
  onRequireAuth: () => void;
  onSelectSeries?: (series: any) => void;
}

export function AlertsScreen({ sessionToken, onRequireAuth, onSelectSeries }: AlertsScreenProps) {
  const { colors } = useTheme();
  const [activeSegment, setActiveSegment] = useState<'updates' | 'announcements' | 'invitations'>('updates');

  // Query reader notifications
  const { data: notificationsList, isLoading: notifsLoading, refetch: refetchNotifs } =
    (trpc.user.getReaderNotifications as any).useQuery(undefined, {
      enabled: !!sessionToken,
    });

  // Query collaboration invitations
  const { data: invitationsList, isLoading: collabsLoading, refetch: refetchInvitations } =
    (trpc.collaboration.getReceivedInvitations as any).useQuery(undefined, {
      enabled: !!sessionToken && activeSegment === 'invitations',
    });

  const respondInvitationMutation = trpc.collaboration.respondToInvitation.useMutation({
    onSuccess: (_, vars) => {
      refetchInvitations();
      Alert.alert('Invitation Updated', `You have ${vars.response === 'ACCEPT' ? 'accepted' : 'declined'} the collaboration invitation.`);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleRespond = (invitationId: string, response: 'ACCEPT' | 'DECLINE') => {
    respondInvitationMutation.mutate({ invitationId, response });
  };

  const markReadMutation = ((trpc.user as any).markNotificationRead).useMutation({
    onSuccess: () => refetchNotifs(),
  });

  const handlePressNotif = (notif: any) => {
    if (notif.id && !notif.id.startsWith('mock-')) {
      markReadMutation.mutate({ notificationId: notif.id });
    }
    if (onSelectSeries && (notif.series || notif.seriesId)) {
      onSelectSeries(notif.series || { id: notif.seriesId, title: notif.title });
    }
  };

  if (!sessionToken) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
          <AlertsIcon size={32} color={colors.primary} />
        </View>
        <Text style={[styles.authTitle, { color: colors.text }]}>Sign in to view your alerts</Text>
        <Text style={[styles.authSubtitle, { color: colors.textMuted }]}>
          Get notified when followed creators publish new chapters, launch collaboration requests, or post announcements.
        </Text>
        <TouchableOpacity
          style={[styles.authBtn, { backgroundColor: colors.primary }]}
          onPress={onRequireAuth}
          activeOpacity={0.8}
        >
          <Text style={styles.authBtnText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter notifications by segment
  const allNotifs = (notificationsList && notificationsList.length > 0)
    ? notificationsList
    : MOCK_NOTIFICATIONS;

  const updateNotifs = allNotifs.filter((n: any) => 
    n.type === 'new_chapter' || 
    n.type === 'new_series' || 
    (!n.type && !n.title?.includes('Sale') && !n.title?.includes('Policy') && !n.title?.includes('Status') && !n.title?.includes('Hiatus') && !n.title?.includes('Season'))
  );

  const announcementNotifs = allNotifs.filter((n: any) => 
    n.type === 'series_status' || 
    n.type === 'creator_application' || 
    n.title?.includes('Status') ||
    n.title?.includes('Hiatus') ||
    n.title?.includes('Season') ||
    n.title?.includes('Coming Soon') ||
    n.title?.includes('Sale') || 
    n.title?.includes('Policy') || 
    n.title?.includes('Announcement') || 
    n.title?.includes('Approved')
  );

  const collabs = invitationsList || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.headerIconBg, { backgroundColor: colors.primary }]}>
            <AlertsIcon size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Alerts & Activity</Text>
        </View>

        {/* Segments */}
        <View style={styles.segmentBar}>
          {(['updates', 'announcements', 'invitations'] as const).map((seg) => {
            const isSelected = activeSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primaryDark : colors.border,
                  },
                ]}
                onPress={() => setActiveSegment(seg)}
              >
                <Text style={[styles.segmentBtnText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                  {seg === 'updates' ? 'Releases' : seg === 'announcements' ? 'Announcements & Status' : 'Invitations'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {activeSegment === 'updates' && (
          <View style={{ gap: 12 }}>
            {notifsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : updateNotifs.length > 0 ? (
              updateNotifs.map((notif: any) => {
                const isUnread = notif.isRead === false || notif.read === false;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.alertCard, 
                      { 
                        backgroundColor: isUnread ? (colors.surfaceElevated || '#161822') : colors.surface, 
                        borderColor: isUnread ? (colors.primary || '#3b82f6') : colors.border 
                      }
                    ]}
                    onPress={() => handlePressNotif(notif)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.alertIconBg, { backgroundColor: colors.primaryMuted }]}>
                      <BookOpenIcon size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.alertCardTitle, { color: colors.text }]}>{notif.title}</Text>
                        {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                      </View>
                      <Text style={[styles.alertCardMsg, { color: colors.textSecondary }]}>{notif.body || notif.message}</Text>
                      <Text style={[styles.alertCardDate, { color: colors.textMuted }]}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <BookOpenIcon size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No new content updates</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Follow creators and series to receive alerts as soon as new episodes and series are published.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeSegment === 'announcements' && (
          <View style={{ gap: 12 }}>
            {notifsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : announcementNotifs.length > 0 ? (
              announcementNotifs.map((notif: any) => {
                const isUnread = notif.isRead === false || notif.read === false;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.alertCard, 
                      { 
                        backgroundColor: isUnread ? (colors.surfaceElevated || '#161822') : colors.surface, 
                        borderColor: isUnread ? (colors.accentGold || '#f59e0b') : colors.border 
                      }
                    ]}
                    onPress={() => handlePressNotif(notif)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.alertIconBg, { backgroundColor: colors.primaryMuted }]}>
                      <SparklesIcon size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.alertCardTitle, { color: colors.text }]}>{notif.title}</Text>
                        {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentGold || '#f59e0b' }} />}
                      </View>
                      <Text style={[styles.alertCardMsg, { color: colors.textSecondary }]}>{notif.body || notif.message}</Text>
                      <Text style={[styles.alertCardDate, { color: colors.textMuted }]}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <SparklesIcon size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No announcements</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Platform news, series status updates, hiatus alerts, and new seasons will show up here.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeSegment === 'invitations' && (
          <View style={{ gap: 12 }}>
            {collabsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : collabs.length > 0 ? (
              collabs.map((inv: any) => (
                <View
                  key={inv.id}
                  style={[styles.collabCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.alertIconBg, { backgroundColor: colors.primaryMuted }]}>
                      <UsersIcon size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alertCardTitle, { color: colors.text }]}>
                        Collaboration Invitation: {inv.series?.title || 'Untitled'}
                      </Text>
                      <Text style={[styles.collabRoleText, { color: colors.primary }]}>
                        Offered Role: {inv.role} ({inv.shareRatio}% split)
                      </Text>
                    </View>
                  </View>

                  {inv.message && (
                    <Text style={[styles.collabMsgText, { color: colors.textSecondary }]}>"{inv.message}"</Text>
                  )}

                  {inv.status === 'PENDING' ? (
                    <View style={styles.collabActionRow}>
                      <TouchableOpacity
                        style={[styles.collabBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleRespond(inv.id, 'ACCEPT')}
                        disabled={respondInvitationMutation.isLoading}
                      >
                        <CheckIcon size={16} color="#FFFFFF" />
                        <Text style={styles.collabBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.collabBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                        onPress={() => handleRespond(inv.id, 'DECLINE')}
                        disabled={respondInvitationMutation.isLoading}
                      >
                        <CloseIcon size={16} color={colors.textMuted} />
                        <Text style={[styles.collabBtnText, { color: colors.textSecondary }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: inv.status === 'ACCEPTED' ? colors.successMuted : colors.surface }]}>
                      <Text style={{ color: inv.status === 'ACCEPTED' ? colors.success : colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                        Status: {inv.status}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <UsersIcon size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No collaboration invitations</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  When creators invite you to collaborate as an artist, writer, colorist, or editor, their invitations will appear here.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  authBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  authBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  segmentBar: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertCardMsg: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  alertCardDate: {
    fontSize: 10,
    marginTop: 6,
  },
  collabCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  collabRoleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  collabMsgText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  collabActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  collabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  collabBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
