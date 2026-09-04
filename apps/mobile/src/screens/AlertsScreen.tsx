import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { trpc } from '../../lib/trpc';
import {
  Bell,
  BookOpen,
  Sparkles,
  Users,
  Check,
  X,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '@panelva/ui';
import { MOCK_NOTIFICATIONS } from '../data/mockData';

interface AlertsScreenProps {
  sessionToken: string | null;
  onRequireAuth: () => void;
  onSelectSeries?: (series: any) => void;
}

function AlertsSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonTextCol}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonBody} />
            <View style={styles.skeletonDate} />
          </View>
        </Card>
      ))}
    </View>
  );
}

export function AlertsScreen({ sessionToken, onRequireAuth, onSelectSeries }: AlertsScreenProps) {
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
      Alert.alert(
        'Invitation Updated',
        `You have ${vars.response === 'ACCEPT' ? 'accepted' : 'declined'} the collaboration invitation.`
      );
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
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.iconCircle}>
          <Bell size={32} color={colors.primary} />
        </View>
        <Text style={styles.authTitle}>Sign in to view your alerts</Text>
        <Text style={styles.authSubtitle}>
          Get notified when followed creators publish new chapters, launch collaboration requests, or post announcements.
        </Text>
        <View style={{ marginTop: spacing.md, width: '100%', maxWidth: 280 }}>
          <Button title="Sign In / Register" variant="primary" onPress={onRequireAuth} />
        </View>
      </View>
    );
  }

  // Filter notifications by segment
  const allNotifs =
    notificationsList && notificationsList.length > 0 ? notificationsList : MOCK_NOTIFICATIONS;

  const updateNotifs = allNotifs.filter(
    (n: any) =>
      n.type === 'new_chapter' ||
      n.type === 'new_series' ||
      (!n.type &&
        !n.title?.includes('Sale') &&
        !n.title?.includes('Policy') &&
        !n.title?.includes('Status') &&
        !n.title?.includes('Hiatus') &&
        !n.title?.includes('Season'))
  );

  const announcementNotifs = allNotifs.filter(
    (n: any) =>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBg}>
            <Bell size={18} color={colors.text} />
          </View>
          <Text style={styles.headerTitle}>Alerts & Activity</Text>
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
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveSegment(seg)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${seg} segment`}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    { color: isSelected ? colors.text : colors.textMuted },
                  ]}
                >
                  {seg === 'updates'
                    ? 'Releases'
                    : seg === 'announcements'
                    ? 'Announcements'
                    : 'Invitations'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {activeSegment === 'updates' && (
          <View style={{ gap: spacing.md }}>
            {notifsLoading ? (
              <AlertsSkeleton />
            ) : updateNotifs.length > 0 ? (
              updateNotifs.map((notif: any) => {
                const isUnread = notif.isRead === false || notif.read === false;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    onPress={() => handlePressNotif(notif)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${isUnread ? 'Unread release' : 'Release'}: ${notif.title}`}
                  >
                    <Card
                      style={[
                        styles.alertCard,
                        { borderColor: isUnread ? colors.primary : colors.border },
                      ]}
                    >
                      <View style={styles.alertIconBg}>
                        <BookOpen size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.alertCardTitle}>{notif.title}</Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.alertCardMsg}>
                          {notif.body || notif.message}
                        </Text>
                        <Text style={styles.alertCardDate}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Card style={styles.emptyCard}>
                <BookOpen size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No New Content Updates</Text>
                <Text style={styles.emptySub}>
                  Follow creators and series to receive alerts as soon as new episodes and series are published.
                </Text>
              </Card>
            )}
          </View>
        )}

        {activeSegment === 'announcements' && (
          <View style={{ gap: spacing.md }}>
            {notifsLoading ? (
              <AlertsSkeleton />
            ) : announcementNotifs.length > 0 ? (
              announcementNotifs.map((notif: any) => {
                const isUnread = notif.isRead === false || notif.read === false;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    onPress={() => handlePressNotif(notif)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${isUnread ? 'Unread announcement' : 'Announcement'}: ${notif.title}`}
                  >
                    <Card
                      style={[
                        styles.alertCard,
                        { borderColor: isUnread ? colors.warning : colors.border },
                      ]}
                    >
                      <View style={styles.alertIconBg}>
                        <Sparkles size={18} color={colors.warning} />
                      </View>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.alertCardTitle}>{notif.title}</Text>
                          {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.warning }]} />}
                        </View>
                        <Text style={styles.alertCardMsg}>
                          {notif.body || notif.message}
                        </Text>
                        <Text style={styles.alertCardDate}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Card style={styles.emptyCard}>
                <Sparkles size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Announcements</Text>
                <Text style={styles.emptySub}>
                  Platform news, series status updates, hiatus alerts, and new seasons will show up here.
                </Text>
              </Card>
            )}
          </View>
        )}

        {activeSegment === 'invitations' && (
          <View style={{ gap: spacing.md }}>
            {collabsLoading ? (
              <AlertsSkeleton />
            ) : collabs.length > 0 ? (
              collabs.map((inv: any) => (
                <Card key={inv.id} style={styles.collabCard}>
                  <View style={styles.collabHeaderRow}>
                    <View style={styles.alertIconBg}>
                      <Users size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <Text style={styles.alertCardTitle}>
                        Collaboration Invitation: {inv.series?.title || 'Untitled'}
                      </Text>
                      <Text style={styles.collabRoleText}>
                        Offered Role: {inv.role} ({inv.shareRatio}% split)
                      </Text>
                    </View>
                  </View>

                  {inv.message && (
                    <Text style={styles.collabMsgText}>"{inv.message}"</Text>
                  )}

                  {inv.status === 'PENDING' ? (
                    <View style={styles.collabActionRow}>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Accept"
                          variant="primary"
                          onPress={() => handleRespond(inv.id, 'ACCEPT')}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Decline"
                          variant="secondary"
                          onPress={() => handleRespond(inv.id, 'DECLINE')}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}>
                      <Badge variant={inv.status === 'ACCEPTED' ? 'success' : 'primary'} size="sm">
                        Status: {inv.status}
                      </Badge>
                    </View>
                  )}
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Users size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Collaboration Invitations</Text>
                <Text style={styles.emptySub}>
                  When creators invite you to collaborate as an artist, writer, colorist, or editor, their invitations will appear here.
                </Text>
              </Card>
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
    backgroundColor: colors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  authTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  authSubtitle: {
    fontSize: typography.small.fontSize,
    textAlign: 'center',
    lineHeight: typography.small.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  segmentBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertCardTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  alertCardMsg: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  alertCardDate: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  collabCard: {
    gap: spacing.sm,
  },
  collabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  collabRoleText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  collabMsgText: {
    fontSize: typography.caption.fontSize,
    fontStyle: 'italic',
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  collabActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  skeletonTextCol: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  skeletonBody: {
    width: '90%',
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  skeletonDate: {
    width: '30%',
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
});
