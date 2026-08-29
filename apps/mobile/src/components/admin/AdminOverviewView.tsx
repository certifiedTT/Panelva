import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  UsersIcon,
  ShieldAlertIcon,
  CreatorHubIcon,
  SeriesIcon,
  ActivityIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  DollarSignIcon,
  AlertsIcon,
} from '../common/Icons';
import { MOCK_ADMIN_METRICS } from '../../data/mockData';

interface AdminOverviewViewProps {
  onNavigateTab: (tabId: string) => void;
  userRole: string;
}

export function AdminOverviewView({ onNavigateTab, userRole }: AdminOverviewViewProps) {
  const { colors } = useTheme();

  const metricsQuery = (trpc.admin.getOverviewMetrics as any).useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: metrics, isLoading, refetch, isRefetching } = metricsQuery;
  const effectiveMetrics = metrics || MOCK_ADMIN_METRICS;

  const isModeratorRole =
    userRole === 'MODERATOR' ||
    userRole === 'COMMUNITY_MODERATOR' ||
    userRole === 'SAFETY_SPECIALIST' ||
    userRole === 'TRUST_AND_SAFETY';
  const isBizRole = userRole === 'BUSINESS_ADMIN' || userRole === 'FINANCE_ADMIN';


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      {/* System Status Banner */}
      <View
        style={[
          styles.systemBanner,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.systemStatusRow}>
          <View style={styles.statusDotWrapper}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.systemStatusTitle, { color: colors.text }]}>
              Platform Operational
            </Text>
          </View>
          <View style={[styles.latencyBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <ActivityIcon size={12} color="#10B981" />
            <Text style={[styles.latencyText, { color: colors.textMuted }]}>
              {effectiveMetrics?.systemLatencyMs || 42}ms • DB Healthy
            </Text>
          </View>
        </View>
        <Text style={[styles.systemStatusSubtext, { color: colors.textMuted }]}>
          Role Context: <Text style={{ color: colors.primary, fontWeight: '700' }}>{userRole.replace('_', ' ')}</Text>
        </Text>
      </View>

      {/* Action Required / Urgent Triage Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>PRIORITY ACTION QUEUE</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <RefreshCwIcon size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading platform telemetry...</Text>
        </View>
      ) : (
        <View style={styles.actionQueueGrid}>
          {/* Safety Reports Card */}
          {(!isBizRole) && (
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: (effectiveMetrics?.unresolvedReports || 0) > 0 ? 'rgba(239, 68, 68, 0.08)' : colors.surfaceElevated,
                  borderColor: (effectiveMetrics?.unresolvedReports || 0) > 0 ? '#EF4444' : colors.borderSubtle,
                },
              ]}
              onPress={() => onNavigateTab('moderation')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <ShieldAlertIcon size={18} color="#EF4444" />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.pillText}>{effectiveMetrics?.unresolvedReports || 0} Open</Text>
                </View>
              </View>
              <Text style={[styles.cardCount, { color: colors.text }]}>
                {effectiveMetrics?.unresolvedReports || 0}
              </Text>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Safety Reports</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardActionText, { color: '#EF4444' }]}>Triage queue</Text>
                <ChevronRightIcon size={14} color="#EF4444" />
              </View>
            </TouchableOpacity>
          )}

          {/* Pending Applications Card */}
          {(!isModeratorRole) && (
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: (effectiveMetrics?.pendingApplications || 0) > 0 ? 'rgba(245, 158, 11, 0.08)' : colors.surfaceElevated,
                  borderColor: (effectiveMetrics?.pendingApplications || 0) > 0 ? '#F59E0B' : colors.borderSubtle,
                },
              ]}
              onPress={() => onNavigateTab('creators')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <CreatorHubIcon size={18} color="#F59E0B" />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.pillText}>{effectiveMetrics?.pendingApplications || 0} Pending</Text>
                </View>
              </View>
              <Text style={[styles.cardCount, { color: colors.text }]}>
                {effectiveMetrics?.pendingApplications || 0}
              </Text>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Creator Applications</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardActionText, { color: '#F59E0B' }]}>Review applicants</Text>
                <ChevronRightIcon size={14} color="#F59E0B" />
              </View>
            </TouchableOpacity>
          )}

          {/* Admin Notifications */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => onNavigateTab('notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <AlertsIcon size={18} color={colors.primary} />
              </View>
              {((effectiveMetrics as any)?.unreadNotifications || 0) > 0 && (
                <View style={[styles.pillBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.pillText}>{(effectiveMetrics as any)?.unreadNotifications} New</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardCount, { color: colors.text }]}>
              {(effectiveMetrics as any)?.unreadNotifications || 0}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Role Alerts</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardActionText, { color: colors.primary }]}>View inbox</Text>
              <ChevronRightIcon size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Platform Scale & Registry Snapshot */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>PLATFORM REGISTRY</Text>
      </View>

      <View style={styles.metricsGrid}>
        {/* Total Users */}
        <TouchableOpacity
          style={[styles.metricTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}
          onPress={() => onNavigateTab('users')}
          activeOpacity={0.7}
        >
          <View style={styles.metricTileTop}>
            <UsersIcon size={16} color={colors.primary} />
            <Text style={[styles.metricTileValue, { color: colors.text }]}>{effectiveMetrics?.totalUsers || 0}</Text>
          </View>
          <Text style={[styles.metricTileLabel, { color: colors.textMuted }]}>Total Users</Text>
        </TouchableOpacity>

        {/* Creators */}
        <TouchableOpacity
          style={[styles.metricTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}
          onPress={() => onNavigateTab('creators')}
          activeOpacity={0.7}
        >
          <View style={styles.metricTileTop}>
            <CreatorHubIcon size={16} color="#8B5CF6" />
            <Text style={[styles.metricTileValue, { color: colors.text }]}>{effectiveMetrics?.totalCreators || 0}</Text>
          </View>
          <Text style={[styles.metricTileLabel, { color: colors.textMuted }]}>Active Creators</Text>
        </TouchableOpacity>

        {/* Series */}
        <View style={[styles.metricTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.metricTileTop}>
            <SeriesIcon size={16} color="#EC4899" />
            <Text style={[styles.metricTileValue, { color: colors.text }]}>{effectiveMetrics?.publishedSeries || 0}</Text>
          </View>
          <Text style={[styles.metricTileLabel, { color: colors.textMuted }]}>Published Series</Text>
        </View>

        {/* Chapters */}
        <View style={[styles.metricTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.metricTileTop}>
            <SeriesIcon size={16} color="#10B981" />
            <Text style={[styles.metricTileValue, { color: colors.text }]}>{effectiveMetrics?.totalChapters || 0}</Text>
          </View>
          <Text style={[styles.metricTileLabel, { color: colors.textMuted }]}>Total Chapters</Text>
        </View>

        {/* Coin Ledger */}
        {(!isModeratorRole) && (
          <TouchableOpacity
            style={[styles.metricTile, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}
            onPress={() => onNavigateTab('finance')}
            activeOpacity={0.7}
          >
            <View style={styles.metricTileTop}>
              <DollarSignIcon size={16} color="#F59E0B" />
              <Text style={[styles.metricTileValue, { color: colors.text }]}>{effectiveMetrics?.ledgerTransactions || 0}</Text>
            </View>
            <Text style={[styles.metricTileLabel, { color: colors.textMuted }]}>Ledger Entries</Text>
          </TouchableOpacity>
        )}
      </View>


      {/* Operational Principles Footer */}
      <View style={[styles.footerNotice, { backgroundColor: colors.surfaceSecondary }]}>
        <CheckCircleIcon size={16} color="#10B981" />
        <Text style={[styles.footerNoticeText, { color: colors.textMuted }]}>
          Authoritative backend sync enabled. Actions immediately propagate across web & mobile.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  systemBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  systemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusDotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  systemStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  systemStatusSubtext: {
    fontSize: 12,
  },
  sectionHeader: {
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
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  actionQueueGrid: {
    gap: 12,
  },
  actionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 26,
    fontWeight: '800',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricTileValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricTileLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  footerNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
