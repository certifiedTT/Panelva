import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  AlertsIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
} from '../common/Icons';
import { MOCK_ADMIN_NOTIFICATIONS } from '../../data/mockData';

export function AdminNotificationsView() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();

  const [readNotifIds, setReadNotifIds] = React.useState<Record<string, boolean>>({});

  const notificationsQuery = (trpc.admin.getAdminNotifications as any).useQuery();
  const { data: notifications, isLoading, refetch, isRefetching } = notificationsQuery;

  const rawNotifs = (notifications && notifications.length > 0) ? notifications : MOCK_ADMIN_NOTIFICATIONS;
  const effectiveNotifications = rawNotifs.map((n: any) => ({
    ...n,
    isRead: n.isRead || !!readNotifIds[n.id],
  }));

  const markReadMutation = (trpc.admin.markAdminNotificationRead as any).useMutation({
    onSuccess: () => {
      (utils.admin as any).getAdminNotifications.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
    },
    onError: () => {
      // Mock fallback
    },
  });

  const markAllReadMutation = (trpc.admin.bulkMarkAdminNotificationsRead as any).useMutation({
    onSuccess: () => {
      (utils.admin as any).getAdminNotifications.invalidate();
      (utils.admin as any).getOverviewMetrics.invalidate();
      Alert.alert('Notifications Cleared', 'All role notifications marked as read.');
    },
    onError: () => {
      const allReadMap: Record<string, boolean> = {};
      rawNotifs.forEach((n: any) => { allReadMap[n.id] = true; });
      setReadNotifIds(allReadMap);
      Alert.alert('Notifications Cleared (Preview)', 'All role notifications marked as read.');
    },
  });


  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return '#DC2626';
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      default:
        return colors.primary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.text }]}>ROLE-ROUTED NOTIFICATIONS</Text>
        <TouchableOpacity
          onPress={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          activeOpacity={0.7}
        >
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading alerts...</Text>
        </View>
      ) : (effectiveNotifications || []).length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <CheckCircleIcon size={32} color="#10B981" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Inbox Clean</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            No unread notifications for your role.
          </Text>
        </View>
      ) : (
        effectiveNotifications.map((n: any) => {
          const priorityColor = getPriorityColor(n.priority);

          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.notifCard,
                {
                  backgroundColor: n.isRead ? colors.surfaceElevated : 'rgba(59, 130, 246, 0.06)',
                  borderColor: n.isRead ? colors.borderSubtle : colors.primary,
                },
              ]}
              onPress={() => {
                if (!n.isRead) {
                  setReadNotifIds((prev) => ({ ...prev, [n.id]: true }));
                  markReadMutation.mutate({ id: n.id });
                }
              }}
              activeOpacity={0.8}
            >

              <View style={styles.notifHeader}>
                <View style={styles.badgeGroup}>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                    <Text style={styles.priorityText}>{n.priority}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.categoryText, { color: colors.textMuted }]}>{n.category}</Text>
                  </View>
                </View>
                {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>

              <Text style={[styles.notifTitle, { color: colors.text }]}>{n.title}</Text>
              <Text style={[styles.notifMessage, { color: colors.textMuted }]}>{n.message}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
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
  notifCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
});
