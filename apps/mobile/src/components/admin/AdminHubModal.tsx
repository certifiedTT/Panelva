import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  LayoutDashboard,
  Users,
  Palette,
  ShieldAlert,
  Coins,
  Activity,
  Bell,
  Lock,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminModerationView } from './AdminModerationView';
import { AdminCreatorsView } from './AdminCreatorsView';
import { AdminUsersView } from './AdminUsersView';
import { AdminFinanceView } from './AdminFinanceView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminNotificationsView } from './AdminNotificationsView';
import {
  getVisibleAdminTabs,
  getRoleDisplayName,
} from '../../data/mockRoles';
import { MobileWorkspaceLayout, MobileWorkspaceNavGroup } from '../workspace/WorkspaceLayout';

interface AdminHubModalProps {
  visible: boolean;
  onClose: () => void;
  dbUser: any;
}

export function AdminHubModal({ visible, onClose, dbUser }: AdminHubModalProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const userRole = dbUser?.role || 'USER';
  const roleLabel = getRoleDisplayName(userRole);
  const allowedTabs = getVisibleAdminTabs(userRole);

  const adminNavGroups: MobileWorkspaceNavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Operations Overview',
          icon: ({ size, color }) => <LayoutDashboard size={size || 20} color={color} />,
          authorized: allowedTabs.includes('overview' as any),
        },
      ],
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        {
          id: 'users',
          label: 'User Directory',
          icon: ({ size, color }) => <Users size={size || 20} color={color} />,
          authorized: allowedTabs.includes('users' as any),
        },
        {
          id: 'creators',
          label: 'Creator Directory',
          icon: ({ size, color }) => <Palette size={size || 20} color={color} />,
          authorized: allowedTabs.includes('creators' as any),
        },
        {
          id: 'moderation',
          label: 'Moderation & Safety',
          icon: ({ size, color }) => <ShieldAlert size={size || 20} color={color} />,
          authorized: allowedTabs.includes('moderation' as any),
        },
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        {
          id: 'finance',
          label: 'Platform Finance & Payouts',
          icon: ({ size, color }) => <Coins size={size || 20} color={color} />,
          authorized: allowedTabs.includes('finance' as any),
        },
      ],
    },
    {
      id: 'system',
      label: 'System & Governance',
      items: [
        {
          id: 'audit',
          label: 'Audit Logs',
          icon: ({ size, color }) => <Activity size={size || 20} color={color} />,
          authorized: allowedTabs.includes('audit' as any),
        },
        {
          id: 'notifications',
          label: 'Alerts & System Logs',
          icon: ({ size, color }) => <Bell size={size || 20} color={color} />,
          authorized: allowedTabs.includes('notifications' as any),
        },
      ],
    },
  ];

  // If active tab is not visible for current role, default to first visible tab or empty
  const hasAccess = allowedTabs.length > 0;
  const effectiveActiveTab = allowedTabs.includes(activeTab as any)
    ? activeTab
    : (allowedTabs[0] || 'overview');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <MobileWorkspaceLayout
        type="admin"
        title="Admin Console"
        contextSubtitle={hasAccess ? effectiveActiveTab.toUpperCase() : 'RESTRICTED'}
        user={{
          username: dbUser?.username || 'Admin',
          role: userRole,
        }}
        roleBadge={roleLabel}
        groups={adminNavGroups}
        activeTab={effectiveActiveTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onClose={onClose}
      >
        {/* Active Operational View */}
        <View style={styles.mainContent}>
          {!hasAccess ? (
            <View style={styles.unauthorizedContainer}>
              <Card style={styles.unauthorizedCard}>
                <Lock size={44} color={colors.danger} />
                <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
                <Text style={styles.unauthorizedDesc}>
                  Your current account role ({roleLabel}) does not have administrative clearance for this console.
                </Text>
                <View style={styles.unauthorizedBtnWrap}>
                  <Button title="Close Console" variant="secondary" onPress={onClose} />
                </View>
              </Card>
            </View>
          ) : (
            <>
              {effectiveActiveTab === 'overview' && (
                <AdminOverviewView onNavigateTab={(tab) => setActiveTab(tab)} userRole={userRole} />
              )}
              {effectiveActiveTab === 'moderation' && <AdminModerationView />}
              {effectiveActiveTab === 'creators' && <AdminCreatorsView />}
              {effectiveActiveTab === 'users' && <AdminUsersView currentAdminRole={userRole} />}
              {effectiveActiveTab === 'finance' && <AdminFinanceView />}
              {effectiveActiveTab === 'audit' && <AdminAuditLogsView />}
              {effectiveActiveTab === 'notifications' && <AdminNotificationsView />}
            </>
          )}
        </View>
      </MobileWorkspaceLayout>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  unauthorizedContainer: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthorizedCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  unauthorizedTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  unauthorizedDesc: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  unauthorizedBtnWrap: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
